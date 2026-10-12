import { db } from "./db";
import { readJson } from "./business-rules";
export type ItyConfig={mode:"DEMO"|"LIVE";customer:string;domain:string;server:string;secret:string};
export async function getItyConfig(){return readJson<ItyConfig>((await db.setting.findUnique({where:{key:"ity"}}))?.value,{mode:"DEMO",customer:"",domain:"",server:"",secret:""});}
