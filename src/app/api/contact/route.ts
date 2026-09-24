import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Email service is not configured yet." },
        { status: 500 },
      );
    }

    const recipient = (process.env.CONTACT_EMAIL || "francisdennisblack@gmail.com").trim().toLowerCase();
    const resend = new Resend(resendApiKey);

    const { data, error } = await resend.emails.send({
      from: process.env.CONTACT_FROM_EMAIL || "HealthFood4U <onboarding@resend.dev>",
      to: [recipient],
      replyTo: email,
      subject: `New website inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    if (error || !data?.id) {
      console.error("Resend rejected contact email:", error?.name, error?.message);
      return NextResponse.json(
        { error: "Unable to send email right now." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact email send failed:", error);
    return NextResponse.json(
      { error: "Unable to send email right now." },
      { status: 500 },
    );
  }
}
