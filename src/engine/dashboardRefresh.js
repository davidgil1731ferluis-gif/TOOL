// Reads the current workspace through the existing queue; never stores aggregate KPI values.
export async function readDashboardSnapshot(repo,{local=false}={}){
 if(!local)await repo.flush({refresh:true});
 const [data,sync]=await Promise.all([repo.load(),local?Promise.resolve({pending:0,error:'',lastSyncedAt:null}):repo.status()]);
 return {data,sync};
}
