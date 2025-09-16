type QSeed = any
const H = {'content-type':'application/json','cache-control':'no-store'}
export const onRequestPost: PagesFunction = async ({ request, env }) => {
  // admin guard
  const key = (env as any).ADMIN_KEY as string
  const hdr = (request.headers.get('x-admin-key')||'')
  const cookie = request.headers.get('cookie') || ''
  const ok = (hdr===key) || /codex_admin=1/.test(cookie)
  if (!ok) return new Response(JSON.stringify({ok:false,reason:'unauthorized'}),{status:401,headers:H})

  const kv = (env as any).Codex_KV as KVNamespace
  const queue: QSeed[] = JSON.parse((await kv.get('q:queue','text')) || '[]')
  if (!queue.length) return new Response(JSON.stringify({ok:false,reason:'empty'}),{headers:H})

  const job = queue.shift() as QSeed
  let log = JSON.parse((await kv.get('q:log','text')) || '[]')
  let built: any = null, stage = job.growth?.stage || 'skeleton', status='growing'

  // --- tiny simulated pipeline (replace with real builders) ---
  try{
    if (stage === 'skeleton'){
      // produce a scaffold artifact
      job.payload.artifacts = job.payload.artifacts || []
      job.payload.artifacts.push({kind:'skeleton', note:`prepared ${job.type} scaffold`})
      stage = 'sandbox'
    }
    else if (stage === 'sandbox'){
      job.payload.artifacts.push({kind:'sandbox', note:'built in isolated env'})
      stage = 'pressure-test'
    }
    else if (stage === 'pressure-test'){
      job.payload.artifacts.push({kind:'test', note:'basic tests passed'})
      stage = 'debug'
    }
    else if (stage === 'debug'){
      job.payload.artifacts.push({kind:'debug', note:'no critical issues'})
      stage = 'present'
    }
    else if (stage === 'present'){
      built = {id: job.id, title:job.title || job.description?.slice(0,60)||job.id, when:new Date().toISOString()}
      job.payload.artifacts.push({kind:'present', note:'ready for notification'})
      status = 'ready'
    }
    job.growth.stage = stage
    job.status = (status==='ready') ? 'ready' : 'growing'
  }catch(e:any){
    job.status = 'failed'
    job.growth.stage = stage
    job.payload.artifacts.push({kind:'error', note:String(e)})
  }

  // Completed? move to built list, else back to queue
  if (job.status === 'ready') {
    const builtList = JSON.parse((await kv.get('q:built','text')) || '[]')
    builtList.push({ ...built, seed: job })
    await kv.put('q:built', JSON.stringify(builtList))
  } else {
    queue.push(job) // round-robin; keeps advancing on subsequent /run calls
  }

  // persist queue + log
  await kv.put('q:queue', JSON.stringify(queue))
  log.push({at:Date.now(), id:job.id, stage:job.growth.stage, status:job.status})
  log = log.slice(-500)
  await kv.put('q:log', JSON.stringify(log))

  return new Response(JSON.stringify({ok:true, advanced:job.id, stage:job.growth.stage, status:job.status, queue:queue.length}),{headers:H})
}
