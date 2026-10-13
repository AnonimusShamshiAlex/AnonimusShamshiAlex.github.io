import { getStore } from "@netlify/blobs";
import { handle } from "../lib/handler.mjs";

export default async (req) => handle(req, getStore("rsvp"));
export const config = { path: "/api/*" };
