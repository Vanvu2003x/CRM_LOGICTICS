/* eslint-disable @typescript-eslint/no-require-imports */
const {PrismaClient}=require("@prisma/client");
const {randomBytes,scryptSync}=require("node:crypto");
const db=new PrismaClient();
const hash=password=>{const salt=randomBytes(16).toString("hex");return "scrypt:"+salt+":"+scryptSync(password,salt,64).toString("hex");};
async function main(){
 const team=await db.team.upsert({where:{name:"Kinh doanh Logistics"},update:{},create:{name:"Kinh doanh Logistics"}});
 for(const [email,name,role,extension] of [["admin@logistics.vn","Admin Quản Lý","ADMIN","200"],["minh@logistics.vn","Nguyễn Văn Minh","SALES","201"]])await db.user.upsert({where:{email},update:{},create:{email,name,role,extension,teamId:team.id,password:hash("123456")}});
 for(const user of await db.user.findMany())if(!user.password.startsWith("scrypt:"))await db.user.update({where:{id:user.id},data:{password:hash(user.password)}});
 const users=await db.user.findMany({where:{role:"SALES"}});
 const now=new Date(),at=days=>new Date(now.getTime()+days*86400000);
 const sources=["ITY","TRADE_FAIR","SOCIAL","MANUAL"],companies=["VinaX","Alpha Trading","Beta Foods","Delta Logistics","Hải Nam Import"];
 for(let index=0;index<40;index++){
  const user=users[index%users.length],id="demo-v2-lead-"+index,interested=index%7!==0;
  await db.lead.upsert({where:{id},update:{},create:{id,name:"Khách demo "+(index+1),phone:"090"+String(7000000+index),company:companies[index%companies.length]+" · Demo "+(index+1),salesId:user.id,source:sources[index%4],needs:interested?"FCL Hải Phòng – Singapore":"Chưa có nhu cầu",interestState:interested?"YES":"NO",isInterested:interested,status:interested?"IN_PROGRESS":"FAILED",createdAt:at(-index%12),lastContactAt:at(-index%5),firstContactAt:at(-index%12),followUpAt:at((index%7)-3),originRef:sources[index%4]==="TRADE_FAIR"?"demo-v2-fair":null}});
  if(interested&&index<30){
   const code="DEMO-"+String(index+1).padStart(3,"0"),step=1+(index%13),type=index%2?"IMPORT":"EXPORT",status=index===13?"FAILED":index===12||index===25?"COMPLETED":"IN_PROGRESS";
   const invoice=step===13||index===24,amount=(index+3)*1500000;
   await db.order.upsert({where:{code},update:{},create:{code,leadId:id,salesId:user.id,currentStep:step,type,status,customerName:companies[index%companies.length]+" · Demo "+(index+1),createdAt:at(-index%9),updatedAt:at(-index%4),completedAt:status==="COMPLETED"?at(-1):null,paidAt:status==="COMPLETED"?at(-1):null,failedAt:status==="FAILED"?at(-2):null,failureReason:status==="FAILED"?"Khách chọn phương án khác":null,invoiceNumber:invoice?"DEMO-INV-"+index:null,invoiceIssuedAt:invoice?at(-5):null,invoiceAmount:invoice?amount:null,dueDate:invoice?at(index%8-3):null,stepsData:JSON.stringify({2:{type,exportPort:"Hải Phòng",importPort:"Singapore",transportMethod:"FCL",expectedDate:at(3).toISOString().slice(0,10),itemName:"Hàng demo",quantity:"1 x 20 DC",incoterms:"FOB"},13:invoice?{invoiceNumber:"DEMO-INV-"+index,amount,currency:"VND",dueDate:at(index%8-3).toISOString().slice(0,10),invoiceIssued:true}:{} })}});
   await db.lead.update({where:{id},data:{status:"CONVERTED"}});
  }
  for(let n=0;n<3;n++)await db.callLog.upsert({where:{callid:id+"-"+n},update:{},create:{callid:id+"-"+n,phone:"090"+String(7000000+index),demand:interested?"YES":"NO",customerName:"Khách demo "+(index+1),company:companies[index%companies.length],salesId:user.id,leadId:id,duration:90+index,billsec:60+index,status:n===2&&index%3===0?"NO ANSWER":"ANSWERED",direction:"outbound",startedAt:at(-n)}});
 }
 for(const lead of await db.lead.findMany()){
  const calls=await db.callLog.findMany({where:{phone:lead.phone,salesId:lead.salesId}});
  if(calls.length){await db.callLog.updateMany({where:{id:{in:calls.map(c=>c.id)}},data:{leadId:lead.id}});await db.lead.update({where:{id:lead.id},data:{callCount:calls.length,callDurationSeconds:calls.reduce((sum,c)=>sum+c.billsec,0)}});}
 }
 const campaign=await db.campaign.upsert({where:{id:"demo-v2-campaign"},update:{},create:{id:"demo-v2-campaign",name:"Demo · Logistics tháng 10",description:"Nội dung đa kênh cho dịch vụ vận chuyển",requirements:"1 video, 1 bài viết, 5 ảnh",deadline:at(2)}});
 for(let i=0;i<6;i++)await db.campaignProduct.upsert({where:{id:"demo-v2-product-"+i},update:{},create:{id:"demo-v2-product-"+i,campaignId:campaign.id,userId:users[i%users.length].id,title:["Insight vận tải biển","Bài giới thiệu tuyến Mỹ","Bộ ảnh kho hàng"][i%3],contentType:["VIDEO","POST","PHOTOS"][i%3],requirements:["Video 1 phút 20–30 giây","1 bài viết","5 ảnh"][i%3],deadline:at(i===0?-2:2),step:["SCRIPT_DRAFT","SCRIPT_APPROVED","PRODUCT_DRAFT","PRODUCT_APPROVED","DONE"][i%5],link:i%5?"https://example.com/demo-content":null,submittedAt:i%5?at(-1):null,completedAt:i%5===4?at(-1):null}});
 const fair=await db.tradeFair.upsert({where:{id:"demo-v2-fair"},update:{},create:{id:"demo-v2-fair",name:"Demo · Hội chợ Logistics Việt Nam",startDate:at(1),endDate:at(3)}});
 for(const user of users)for(let day=1;day<=3;day++)for(const slot of ["MORNING","AFTERNOON"]){const id="demo-v2-fair-"+user.id+"-"+day+"-"+slot;await db.tradeFairParticipation.upsert({where:{id},update:{},create:{id,fairId:fair.id,userId:user.id,day:at(day),slot,session:"NONE",reason:"Chưa đăng ký"}});}
 for(const [index,name]of ["KOREA EXPRESS","SHANGHAI LOGISTICS","TOKYO MARITIME","SINGAPORE FREIGHT","GLOBAL FORWARDING"].entries())await db.agent.upsert({where:{id:"demo-v2-agent-"+index},update:{},create:{id:"demo-v2-agent-"+index,name,country:["Hàn Quốc","Trung Quốc","Nhật Bản","Singapore","Mỹ"][index],city:["Busan","Shanghai","Tokyo","Singapore","Los Angeles"][index],rating:4,contact:"Đối tác demo",status:index===4?"INACTIVE":"ACTIVE"}});
 await db.setting.upsert({where:{key:"ity"},update:{},create:{key:"ity",value:JSON.stringify({mode:"DEMO",customer:"demo",domain:"",server:"",secret:randomBytes(24).toString("hex")})}});
 console.log("Đã bổ sung dữ liệu demo; giữ nguyên dữ liệu hiện có. Chạy lại không nhân đôi bản ghi.");
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>db.$disconnect());
