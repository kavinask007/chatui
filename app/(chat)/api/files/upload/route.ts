import { Client } from "minio";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/(auth)/auth";

// Configure Minio client
const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || "*",
  port: Number(process.env.MINIO_PORT) || 80,  
  useSSL: process.env.MINIO_USE_SSL === "false",
  accessKey: process.env.MINIO_ACCESS_KEY || "*",
  secretKey:
    process.env.MINIO_SECRET_KEY || "*",
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || "uploads";

// Use Blob instead of File since File is not available in Node.js environment
const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(", ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Get filename from formData since Blob doesn't have name property
    const filename = (formData.get("file") as File).name;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    try {
      // Ensure bucket exists
      console.log(BUCKET_NAME)
      const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
      if (!bucketExists) {
        await minioClient.makeBucket(BUCKET_NAME);
      }
      // Upload file to MinIO
      console.log({
        "Content-Type": file.type,
      });
      await minioClient.putObject(
        BUCKET_NAME,
        filename,
        fileBuffer,
        fileBuffer.length,
        {
          "Content-Type": file.type,
        }
      );

      // Generate URL for the uploaded file
      var url = await minioClient.presignedGetObject(BUCKET_NAME, filename);
      //xix needed for now Replace https with http in presigned URL if present
      url = url.replace('https://', 'http://');
      return NextResponse.json({
        url,
        pathname: `/${BUCKET_NAME}/${filename}`,
        contentType: file.type,
      });
    } catch (error) {
      console.error("MinIO upload error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (error) {
    console.error("Request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
