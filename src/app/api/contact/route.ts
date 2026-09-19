import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required." },
        { status: 400 },
      );
    }

    const recipient = process.env.CONTACT_EMAIL || "Francisdennisblack@gmail.com";

    await resend.emails.send({
      from: "HealthFood4U <onboarding@resend.dev>",
      to: [recipient],
      replyTo: email,
      subject: `New website inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message.replace(/\n/g, "<br />")}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact email send failed:", error);
    return NextResponse.json(
      { error: "Unable to send email right now." },
      { status: 500 },
    );
  }
}
