import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, tenantName } = await request.json();

    if (!email || !password || !tenantName) {
      return NextResponse.json(
        { error: "Email, password, and tenant name required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Generate tenant slug from name
    const slug = tenantName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // Check if tenant slug already exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Tenant name already taken" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create tenant and user in a transaction
    const result = await prisma.$transaction(async tx => {
      const tenant = await tx.tenant.create({
        data: {
          slug,
          name: tenantName,
          plan: "free",
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password_hash: hashedPassword,
          role: "admin",
          tenant_id: tenant.id,
        },
      });

      // Create example note showcasing all editor features
      const exampleNote = await tx.note.create({
        data: {
          title: "Welcome to MultiNotes! 🎉",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [
                  { type: "text", text: "This is your example note 😊" },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "This is your example note showcasing all the powerful features available in our rich text editor. Feel free to explore and create beautiful, organized notes!",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Text Formatting" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    marks: [{ type: "bold" }],
                    text: "Bold text",
                  },
                  { type: "text", text: ", " },
                  {
                    type: "text",
                    marks: [{ type: "italic" }],
                    text: "italic text",
                  },
                  { type: "text", text: ", " },
                  {
                    type: "text",
                    marks: [{ type: "strike" }],
                    text: "strikethrough",
                  },
                  { type: "text", text: ", " },
                  {
                    type: "text",
                    marks: [{ type: "underline" }],
                    text: "underline",
                  },
                  { type: "text", text: ", " },
                  {
                    type: "text",
                    marks: [{ type: "code" }],
                    text: "inline code",
                  },
                  { type: "text", text: ", and " },
                  {
                    type: "text",
                    marks: [{ type: "highlight", attrs: { color: "#b45309" } }],
                    text: "highlighted text",
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Lists" }],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Bullet list item 1" }],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Bullet list item 2" }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "orderedList",
                content: [
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Numbered list item 1" },
                        ],
                      },
                    ],
                  },
                  {
                    type: "listItem",
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Numbered list item 2" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "taskList",
                content: [
                  {
                    type: "taskItem",
                    attrs: { checked: false },
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Task item 1" }],
                      },
                    ],
                  },
                  {
                    type: "taskItem",
                    attrs: { checked: true },
                    content: [
                      {
                        type: "paragraph",
                        content: [
                          { type: "text", text: "Completed task item 2" },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Block Elements" }],
              },
              {
                type: "blockquote",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "This is a blockquote. Perfect for highlighting important information or quotes.",
                      },
                    ],
                  },
                ],
              },
              {
                type: "codeBlock",
                attrs: { language: "javascript" },
                content: [
                  {
                    type: "text",
                    text: "function greet(name) {\n  return `Hello, ${name}!`;\n}\n\ngreet('World');",
                  },
                ],
              },
              {
                type: "horizontalRule",
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [
                  { type: "text", text: "Links and Advanced Features" },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Check out our " },
                  {
                    type: "text",
                    marks: [
                      {
                        type: "link",
                        attrs: {
                          href: "https://github.com/RanitManik/MultiNotes",
                          target: "_blank",
                        },
                      },
                    ],
                    text: "GitHub repository",
                  },
                  { type: "text", text: " for more information." },
                ],
              },
              {
                type: "paragraph",
                attrs: { textAlign: "center" },
                content: [
                  { type: "text", text: "This paragraph is center-aligned." },
                ],
              },
              {
                type: "paragraph",
                attrs: { textAlign: "right" },
                content: [
                  { type: "text", text: "This paragraph is right-aligned." },
                ],
              },
              {
                type: "paragraph",
                content: [
                  { type: "text", text: "Mathematical expressions: E = mc" },
                  { type: "text", marks: [{ type: "superscript" }], text: "2" },
                  { type: "text", text: " and H" },
                  { type: "text", marks: [{ type: "subscript" }], text: "2" },
                  { type: "text", text: "O" },
                ],
              },
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "Getting Started" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Start creating your own notes by clicking the ",
                  },
                  { type: "text", marks: [{ type: "bold" }], text: "New Note" },
                  {
                    type: "text",
                    text: " button. Use the toolbar above to format your text, and don't forget to give your notes meaningful titles!",
                  },
                ],
              },
            ],
          },
          tenant_id: tenant.id,
          author_id: user.id,
        },
      });

      return { tenant, user };
    });

    // Create JWT token
    const token = createToken({
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      tenantId: result.user.tenant_id,
      tenantSlug: result.tenant.slug,
      tenantPlan: result.tenant.plan,
    });

    return NextResponse.json({
      token,
      tenant: {
        slug: result.tenant.slug,
        name: result.tenant.name,
        plan: result.tenant.plan,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
