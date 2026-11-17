import type { Actions } from "./$types";
import type { PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import {
  addComment,
  getFullComment,
  getSingleUser,
  addUser,
  getAllComments,
  getMapleMob,
  addNewMob,
} from "$lib/db/comments";
import { incrementVisits, getVisits } from "$lib/db/counter";
import { checkImages } from "$lib/validate";
import { uploadImages } from "$lib/upload";

// from isbot
const BOT_UA_REGEX = / daum[ /]| deusu\/|(?:^|[^g])news(?!sapphire)|(?<! channel\/|google\/)google(?!(?:wv|app|\/google| pixel))|(?<! cu)bots?(?:\b|_)|(?<!cam)scan|(?<!lib)http|24x7|;\s\w+;$|@[a-z][\w-]+\.|\(\)|\.com\b|\b\w+\/1\.0;|\bbw\/|\bdlc\b|\bort\/|\bperl\b|\btime\/|\||^[<\(;]|^[\w \.\-\(?:\):%]+(?:\/v?\d+(?:\.\d+)?(?:\.\d{1,10})*?)?(?:,|$)|^[\w\-]+\/[\w]+$|^[^ ]{50,}$|^\d+\b|^\w*search\b|^\w+\/[\w\(\)]*$|^\w+\/\d\.\d\s\([\w@]+\)$|^active|^ad muncher|^amaya|^apache\/|^avsdevicesdk\/|^azure|^biglotron|^blackbox exporter|^bot|^clamav[ /]|^claude-code\/|^client\/|^cobweb\/|^custom|^ddg[_-]android|^discourse|^dispatch\/\d|^downcast\/|^duckduckgo|^email|^exodusmovement|^facebook|^getright\/|^gozilla\/|^hobbit|^hotzonu|^hwcdn\/|^igetter\/|^jeode\/|^jetty\/|^jigsaw|^microsoft bits|^movabletype|^mozilla\/\d\.\d\s[\w\.-]+$|^mozilla\/\d\.\d\s\((?:compatible;)?(?:\s?[\w\d-.]+\/\d+\.\d+)?\)$|^navermailapp|^netsurf|^offline|^openai\/|^owler|^php|^postman|^ps_daily\/|^python|^rank|^read|^reed|^remove\.bg\/|^rest|^rss|^snapchat|^sora |^space bison|^stape\/|^svn|^swcd |^taringa|^thumbor\/|^track|^w3c|^webbandit\/|^webcopier|^wget|^whatsapp|^wordpress|^xenu link sleuth|^yahoo|^yandex|^zdm\/\d|^zoom marketplace\/|abuse|advisor|agent\b|analyzer|archive|ask jeeves\/teoma|attracta|audit|bluecoat drtr|browsex|burpcollaborator|capture|catch|check\b|checker|chrome-lighthouse|chromeframe|classifier|cloudflare|collapsify\b|convertify|cookiehubverify\/|crawl|cursor\/|cypress\/|dareboost|datanyze|dejaclick|detect|discovery|dmbrowser|download|exaleadcloudview|feed|firephp|foregenix|functionize|grab|hardenize\b|headless|hotjar|httrack|hubspot marketing grader|ibisbrowser|infrawatch|insight|inspect|iplabel|java(?!;)|library|linkcheck|linktiger|mail\.ru\/|manager|manus-user\/|marketgoo\/|measure|monitor\b|neustar wpm|node\b|nutch|offbyone|openvas|optimize|pageburst|pagespeed|parser|phantomjs|pingdom|playwright|powermarks|preview|productfinder|prospectingstudio|proxy|ptst[ /]\d|radar|readable\/|retriever|rexx;|rigor|rss\b|scrape|securityheaders|selenium|server|silktide|sindup\/|sogou|sparkler\/|speedcurve|spider|splash|statuscake|supercleaner|synapse|synthetic|testlocally|tools|torrent|transcoder|url|validator|virtuoso|wappalyzer|watchtowr|webglance|webkit2png|whatcms\/|xtate\//i;

export const load: PageServerLoad = async ({ cookies, request }) => {
  const comments = getAllComments();

  const isBot = BOT_UA_REGEX.test(request.headers.get("user-agent") ?? "");
  let visits: number;
  if (!isBot && !cookies.get("visited")) {
    visits = await incrementVisits();
    cookies.set("visited", "1", {
      path: "/",
      maxAge: 86400,
      httpOnly: true,
      sameSite: "lax",
    });
  } else {
    visits = await getVisits();
  }

  return {
    comments,
    visits,
  };
};

export const actions = {
  add_comment: async ({ request }) => {
    const data = await request.formData();
    const name = data.get("name");
    const comment = data.get("comment");
    const id = data.get("id");
    const interval = data.get("interval");
    const offset = data.get("offset");

    if (!name || !comment) {
      return fail(400, { success: false, error: "Missing name or comment" });
    }

    // if a MS mob was selected, check if it is already in the db
    let mobID: number | null = null;
    if (id !== null) {
      const mob = await getMapleMob(Number(id));
      if (mob) {
        // The mob is already in the db, no need to upload the imgs
        mobID = mob.id;
      }
    }

    // if this is a new mob/sprite, upload it to the server
    if (!mobID) {
      // Parse all the images passed through
      const standFiles = data.getAll("stand") as File[];
      const moveFiles = data.getAll("move") as File[];

      if (standFiles.length === 0 || moveFiles.length === 0) {
        mobID = 1; // Default to mob ID 1 if no images are provided
      } else {
        // Convert to buffer and check sizes
        const standBuffers = await Promise.all(
          standFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
        );
        const moveBuffers = await Promise.all(
          moveFiles.map(async (file) => Buffer.from(await file.arrayBuffer())),
        );

        const spriteSize = await checkImages([...standBuffers, ...moveBuffers]);
        if (spriteSize.width > 256 || spriteSize.height > 256) {
          return fail(400, {
            error: "Mob images are too large (stay below 256x256px)",
          });
        }
        // Since there wasn't an error here we are good to create a new mob in the DB
        mobID = await addNewMob({
          width: spriteSize.width,
          height: spriteSize.height,
          interval: Number(interval),
          offset: Number(offset),
          frames: {
            stand: standBuffers.length,
            move: moveBuffers.length,
          },
          mapleID: id ? Number(id) : null,
        });

        // Upload the images to the server
        uploadImages(standBuffers, moveBuffers, mobID);
      }
    }

    // Add the comment to the db
    const user_data = await getSingleUser(String(name));
    let new_comment;
    if (user_data) {
      new_comment = await addComment({
        authorID: user_data.id,
        comment: String(comment),
        mobID: mobID,
      });
    } else {
      const new_user = await addUser({ name: String(name) });
      new_comment = await addComment({
        authorID: new_user.id,
        comment: String(comment),
        mobID: mobID,
      });
    }

    // We need the comment data with the author and mob relations
    const full_comment = await getFullComment(new_comment.id);
    if (!full_comment) {
      return fail(500, { success: false, error: "Failed to get full comment" });
    }

    return {
      success: true,
      comment: full_comment,
      error: null,
    };
  },
} satisfies Actions;
