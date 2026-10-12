export async function register() {
 if(process.env.NEXT_RUNTIME!=="nodejs" || process.env.NEXT_PHASE==="phase-production-build")return;
 const {runReminders}=await import("./lib/reminders");
 const globalJob=globalThis as typeof globalThis & {crmJob?:NodeJS.Timeout;crmJobBusy?:boolean};
 if(globalJob.crmJob)return;
 const tick=async()=>{if(globalJob.crmJobBusy)return;globalJob.crmJobBusy=true;try{await runReminders();}catch{console.error("[CRM reminders] Không cập nhật được nhắc việc.");}finally{globalJob.crmJobBusy=false;}};
 await tick(); globalJob.crmJob=setInterval(()=>void tick(),60000);globalJob.crmJob.unref();
}
