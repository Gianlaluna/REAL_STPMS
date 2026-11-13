require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database");
const { authenticate, allowRoles } = require("./middleware/auth");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
const SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

const safeUser = u => ({ id:u.id, username:u.username, full_name:u.full_name, role:u.role, player_id:u.player_id });
app.post("/api/auth/login", (req,res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username=?").get(username || "");
  if (!user || !bcrypt.compareSync(password || "", user.password_hash))
    return res.status(401).json({error:"Invalid username or password."});
  const payload = safeUser(user);
  const token = jwt.sign(payload, SECRET, {expiresIn:"8h"});
  res.json({token, user:payload});
});
app.get("/api/auth/me", authenticate, (req,res)=>res.json({user:req.user}));

app.get("/api/dashboard", authenticate, (req,res) => {
  const teams = db.prepare("SELECT COUNT(*) n FROM teams").get().n;
  const players = db.prepare("SELECT COUNT(*) n FROM players").get().n;
  const schedules = db.prepare("SELECT COUNT(*) n FROM schedules WHERE activity_date >= date('now')").get().n;
  const attendance = db.prepare("SELECT COUNT(*) n FROM attendance WHERE attendance_status='Present'").get().n;
  const upcoming = db.prepare(`SELECT s.*,t.team_name FROM schedules s JOIN teams t ON t.id=s.team_id
    WHERE s.activity_date >= date('now') ORDER BY s.activity_date,s.start_time LIMIT 5`).all();
  res.json({teams,players,upcoming:schedules,present:attendance,activities:upcoming});
});

function crudRoutes(table, fields, roles=["super_admin","coach"]) {
  app.get(`/api/${table}`, authenticate, (req,res) => {
    let rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
    if (req.user.role === "player" && table === "players") rows = rows.filter(x=>x.id===req.user.player_id);
    res.json(rows);
  });
  app.post(`/api/${table}`, authenticate, allowRoles(...roles), (req,res) => {
    const vals = fields.map(f=>req.body[f] ?? null);
    const stmt = db.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(()=>"?").join(",")})`);
    try { const result=stmt.run(...vals); res.status(201).json(db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(result.lastInsertRowid)); }
    catch(e){ res.status(400).json({error:e.message}); }
  });
  app.put(`/api/${table}/:id`, authenticate, allowRoles(...roles), (req,res) => {
    const vals=fields.map(f=>req.body[f] ?? null);
    try { const result=db.prepare(`UPDATE ${table} SET ${fields.map(f=>f+"=?").join(",")} WHERE id=?`).run(...vals,req.params.id);
      if(!result.changes) return res.status(404).json({error:"Record not found."});
      res.json(db.prepare(`SELECT * FROM ${table} WHERE id=?`).get(req.params.id));
    } catch(e){res.status(400).json({error:e.message});}
  });
  app.delete(`/api/${table}/:id`, authenticate, allowRoles(...roles), (req,res)=>{
    const result=db.prepare(`DELETE FROM ${table} WHERE id=?`).run(req.params.id);
    result.changes ? res.json({message:"Deleted successfully."}) : res.status(404).json({error:"Record not found."});
  });
}
crudRoutes("teams",["team_name","sport","coach_name","season"]);
crudRoutes("players",["team_id","first_name","last_name","birth_date","gender","jersey_number","position","contact_number","email"]);
crudRoutes("schedules",["team_id","activity_type","activity_date","start_time","location","notes"]);
crudRoutes("attendance",["player_id","schedule_id","attendance_status","remarks"]);
crudRoutes("player_statistics",["player_id","schedule_id","games_played","points_or_goals","assists","other_stats"]);

app.get("/api/users", authenticate, allowRoles("super_admin"), (_,res)=>{
  res.json(db.prepare("SELECT id,username,full_name,role,player_id,created_at FROM users ORDER BY id DESC").all());
});
app.post("/api/users", authenticate, allowRoles("super_admin"), (req,res)=>{
  const {username,password,full_name,role,player_id}=req.body;
  if(!username||!password||!full_name||!["super_admin","coach","player"].includes(role))
    return res.status(400).json({error:"Complete all required account fields."});
  try {
    const hash=bcrypt.hashSync(password,10);
    const result=db.prepare("INSERT INTO users(username,password_hash,full_name,role,player_id) VALUES(?,?,?,?,?)")
      .run(username,hash,full_name,role,player_id||null);
    res.status(201).json({id:result.lastInsertRowid,username,full_name,role,player_id:player_id||null});
  } catch(e){res.status(400).json({error:"Username already exists or invalid player."});}
});
app.get("/api/health",(_,res)=>res.json({status:"ok",system:"STPMS"}));
app.get("*",(req,res)=>res.sendFile(require("path").join(__dirname,"public","index.html")));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log(`STPMS is running at http://localhost:${PORT}`));
