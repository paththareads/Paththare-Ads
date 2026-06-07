import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, contact, reason, message } = await req.json();

    if (!name || !email || !message || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.CONTACT_EMAIL,
        pass: process.env.CONTACT_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: "themedialink@gmail.com",
      subject: `Contact Form: ${reason}`,
      text: `Name: ${name}\nEmail: ${email}\nContact: ${contact}\nReason: ${reason}\nMessage:\n${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Contact:</strong> ${contact}</p>
             <p><strong>Reason:</strong> ${reason}</p>
             <p><strong>Message:</strong><br/>${message}</p>`,
    });

    return NextResponse.json({ success: true, message: "Message sent!" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}
