// Handles loading XML data exported from MapleStory WZ files for map backgrounds
import { parseXml, XmlElement } from "@rgrove/parse-xml";
import { readFileSync, writeFileSync } from "node:fs";
import type {
  BackNodeData,
  SpriteNodeData,
  LayerData,
  FlattenedLayer,
} from "./ms_types";
import { NodeType } from "./ms_types";

function parseSpriteData(bS_value: string, num: number) {
  const spriteXmlPath = `src/lib/assets/xml/Back.${bS_value}.xml`;
  const xml = readFileSync(spriteXmlPath, "utf8");
  const parsedXml = parseXml(xml.replace(/\s+(?![^<]*>)/g, ""));
  const dirData = parsedXml.children[0] as XmlElement;
  const backData = dirData.children[0] as XmlElement;
  const nodeData = backData.children[num] as XmlElement;
  const nodeAttributeEntries = nodeData.children as XmlElement[];

  const spriteNodeData: SpriteNodeData = {
    no: num,
    origin: nodeAttributeEntries[0].attributes["value"]
      .split(", ")
      .map(Number) as [number, number],
    z: parseInt(nodeAttributeEntries[1].attributes["value"]),
    outlink: nodeAttributeEntries[2].attributes["value"],
  };

  return spriteNodeData;
}

export function parseMapData(map_xml_path: string): LayerData[] {
  const xml = readFileSync(map_xml_path, "utf8");
  const parsedXml = parseXml(xml.replace(/\s+(?![^<]*>)/g, ""));
  const mapData = parsedXml.children[0] as XmlElement;
  const backData = mapData.children[1] as XmlElement;
  const backNodes = backData.children as XmlElement[];

  const layerData = backNodes.map((node) => {
    const nodeAttributes = node.children as XmlElement[];
    const nodeData: Partial<BackNodeData> = {};
    nodeAttributes.forEach((nodeAttribute) => {
      const key = nodeAttribute.attributes["name"] as keyof BackNodeData;
      const value = nodeAttribute.attributes["value"];

      switch (key) {
        case "type":
          nodeData["type"] = parseInt(value) as NodeType;
          break;
        case "bS":
          nodeData[key] = value;
          break;
        default:
          nodeData[key] = parseInt(value);
      }
    });
    const completeNode: BackNodeData = nodeData as BackNodeData;

    const spriteData = parseSpriteData(completeNode.bS, completeNode.no);
    return {
      data: completeNode,
      sprite: spriteData,
      path: `bg/${spriteData.outlink.split("/").slice(-3).join("/")}.png`,
    };
  });

  return layerData;
}

function getLayerType(layer: LayerData): "static" | "dynamic" {
  switch (layer.data.type) {
    case NodeType.SCROLLHORIZONTAL:
    case NodeType.SCROLLVERTICAL:
    case NodeType.BOTHSCROLLHORIZONTAL:
    case NodeType.BOTHSCROLLVERTICAL:
      return "dynamic";
    default:
      return "static";
  }
}

export function flattenLayers(layerData: LayerData[]): FlattenedLayer[] {
  const flattenedData: FlattenedLayer[] = [];

  let storedLayers: LayerData[] = [];
  let currentType: "static" | "dynamic" | undefined;
  layerData.forEach((layer) => {
    const layerType = getLayerType(layer);
    if (currentType === undefined) {
      currentType = layerType;
    }

    if (currentType === layerType) {
      storedLayers.push(layer);
    } else {
      flattenedData.push({ type: currentType, data: storedLayers });
      storedLayers = [layer];
      currentType = layerType;
    }
  });

  if (storedLayers.length > 0 && currentType !== undefined) {
    flattenedData.push({ type: currentType, data: storedLayers });
  }

  return flattenedData;
}

// const mapID = "Map0.000010000";

// const mapData = parseMapData(`src/lib/assets/xml/${mapID}.xml`);

// const layerData = flattenLayers(mapData);

// writeFileSync(
//   `src/lib/assets/parsed/${mapID}.json`,
//   JSON.stringify(layerData, null, 2),
// );
