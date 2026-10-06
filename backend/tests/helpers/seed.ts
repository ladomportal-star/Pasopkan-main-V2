import request from "supertest";
import { decodeJwt } from "jose";
import type { Express } from "express";
import { db } from "../../src/config/database.ts";
export async function createEvent(app: Express, owner: Record<string,string>, overrides: Record<string,unknown> = {}) {
  const claims = decodeJwt(owner.Authorization.slice(7));
  const uid = claims.sub!;
  const user = await db.user.upsert({ where: {authId:uid}, create:{authId:uid,email:String(claims.email ?? ""),role:"organizer"}, update:{} });
  await db.organizer.upsert({where:{userId:user.id},create:{userId:user.id,name:"Host"},update:{}});
  const wantedStatus = overrides.status ?? "published";
  const res = await request(app).post("/api/events").set(owner).send({
    title:"That Luang Festival", tiers:[{name:"General",priceKip:100000,quantityTotal:5},{name:"Free",priceKip:0}], ...overrides, status:"draft",
  });
  if(res.status !== 201) throw new Error("Seed event failed: " + JSON.stringify(res.body));
  // Fixture publication is explicit test setup; production goes through admin review.
  await db.event.update({where:{id:res.body.event.id},data:{status:wantedStatus as any}});
  return {...res.body.event, status:wantedStatus} as { id:string;status:string;tiers:{id:string;name:string;priceKip:number;quantitySold:number}[] };
}
