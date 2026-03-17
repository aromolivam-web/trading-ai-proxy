const express = require("express");
const cors    = require("cors");
const fetch   = require("node-fetch");

const app  = express();
const PORT = process.env.PORT || 3000;
const LIVE = "https://api-capital.backend-capital.com/api/v1";
const DEMO = "https://demo-api-capital.backend-capital.com/api/v1";

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ status:"ok", service:"Trading AI Proxy v5.0" }));

app.post("/session", async (req, res) => {
  const { apiKey, email, password, demo } = req.body;
  if (!apiKey || !email || !password) return res.status(400).json({ error:"Faltan credenciales" });
  const base = demo ? DEMO : LIVE;
  try {
    const r = await fetch(base + "/session", {
      method:"POST",
      headers:{"Content-Type":"application/json","X-CAP-API-KEY":apiKey},
      body:JSON.stringify({identifier:email,password,encryptedPassword:false}),
    });
    const cst = r.headers.get("CST"), token = r.headers.get("X-SECURITY-TOKEN");
    const body = await r.json().catch(()=>({}));
    if (!r.ok) return res.status(r.status).json({error:body?.errorCode||"Auth failed"});
    if (!cst||!token) return res.status(401).json({error:"No tokens. Activa 2FA."});
    res.json({cst,token,base});
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/markets/:epic", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  try {
    const r = await fetch(base+"/markets/"+req.params.epic,{headers:{"X-SECURITY-TOKEN":token,CST:cst}});
    res.json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/prices/:epic", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  const {resolution="HOUR",max=60} = req.query;
  try {
    const r = await fetch(base+"/prices/"+req.params.epic+"?resolution="+resolution+"&max="+max,{headers:{"X-SECURITY-TOKEN":token,CST:cst}});
    res.json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/accounts", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  try {
    const r = await fetch(base+"/accounts",{headers:{"X-SECURITY-TOKEN":token,CST:cst}});
    res.json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

app.get("/positions", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  try {
    const r = await fetch(base+"/positions",{headers:{"X-SECURITY-TOKEN":token,CST:cst}});
    res.json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

app.post("/positions", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  const {epic,direction,size,stopLevel,profitLevel} = req.body;
  if (!epic||!direction||!size) return res.status(400).json({error:"epic, direction y size requeridos"});
  try {
    const body = {epic,direction,size};
    if (stopLevel)   body.stopLevel   = stopLevel;
    if (profitLevel) body.profitLevel = profitLevel;
    const r = await fetch(base+"/positions",{
      method:"POST",
      headers:{"Content-Type":"application/json","X-SECURITY-TOKEN":token,CST:cst},
      body:JSON.stringify(body),
    });
    res.status(r.status).json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

app.delete("/positions/:dealId", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  try {
    const r = await fetch(base+"/positions/"+req.params.dealId,{
      method:"DELETE",
      headers:{"X-SECURITY-TOKEN":token,CST:cst},
    });
    res.status(r.status).json(await r.json().catch(()=>({})));
  } catch(e){res.status(500).json({error:e.message});}
});

app.put("/positions/:dealId", async (req, res) => {
  const {cst,token,base} = getH(req);
  if (!cst) return res.status(401).json({error:"Sin sesion"});
  try {
    const r = await fetch(base+"/positions/"+req.params.dealId,{
      method:"PUT",
      headers:{"Content-Type":"application/json","X-SECURITY-TOKEN":token,CST:cst},
      body:JSON.stringify(req.body),
    });
    res.status(r.status).json(await r.json());
  } catch(e){res.status(500).json({error:e.message});}
});

function getH(req){
  return{cst:req.headers["x-cst"]||"",token:req.headers["x-token"]||"",base:req.headers["x-base"]||LIVE};
}

app.listen(PORT,()=>console.log("Trading AI Proxy v5.0 en puerto "+PORT));