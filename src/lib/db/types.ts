import type {
  BuildQueryResult,
  DBQueryConfig,
  ExtractTablesWithRelations,
} from "drizzle-orm";
import * as schema from "./schema";

type Schema = typeof schema;
type Tables = ExtractTablesWithRelations<Schema>;
type IncludeRelation<TableName extends keyof Tables> = DBQueryConfig<
  "one" | "many",
  boolean,
  Tables,
  Tables[TableName]
>["with"];
type InferResultType<
  TableName extends keyof Tables,
  With extends IncludeRelation<TableName> | undefined = undefined,
> = BuildQueryResult<
  Tables,
  Tables[TableName],
  {
    with: With;
  }
>;

export type FullComment = InferResultType<
  "commentsTable",
  { author: true; mob: true }
> & {
  delta?: string;
};

export type FrameData = {
  stand: string[];
  move: string[];
};

export type PreviewMob = {
  frames: {
    stand: string[];
    move: string[];
  };
  interval: number;
  offset: number;
  author: string;
  comment: string;
};
