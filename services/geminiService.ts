import { GoogleGenAI, Type } from "@google/genai";

export async function extractTextFromImage(
  base64Image: string,
  context: 'licensePlate' | 'odometer'
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const mimeType = "image/jpeg";
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  const promptText = context === 'licensePlate'
    ? "Anda adalah spesialis Optical Character Recognition (OCR). Ekstrak nomor plat dari gambar. Kembalikan hanya karakter alfanumerik dari plat nomor."
    : "Anda adalah spesialis Optical Character Recognition (OCR). Ekstrak pembacaan odometer dari gambar. Kembalikan hanya angka, hapus unit apa pun seperti 'km' atau 'mi'.";

  const textPart = { text: promptText };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "Teks yang diekstrak dari gambar.",
            },
          },
          required: ["text"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && typeof result.text === 'string') {
        return result.text.trim();
    } else {
        throw new Error("Invalid JSON structure received from API for OCR.");
    }

  } catch (error) {
    console.error("Error extracting text with Gemini:", error);
    return 'Gagal memindai.';
  }
}

export async function analyzeCarPartImage(
  base64Image: string,
  partName: string
): Promise<{ status: 'good' | 'not-good'; description: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

  const mimeType = "image/jpeg";
  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType,
    },
  };

  const textPart = {
    text: `Anda adalah seorang ahli inspeksi mobil. Analisis gambar ${partName} mobil ini. Cari kerusakan yang terlihat seperti goresan, penyok, retak, atau keausan yang tidak biasa. Berdasarkan analisis Anda, klasifikasikan kondisinya sebagai 'good' atau 'not-good'. Berikan deskripsi kondisi yang singkat dan jelas dalam Bahasa Indonesia. Jika tidak ada kerusakan yang terlihat, sebutkan itu. Jawab HANYA dalam format JSON yang diminta.`,
  };
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "Kondisi bagian mobil, antara 'good' atau 'not-good'.",
            },
            description: {
              type: Type.STRING,
              description: "Deskripsi singkat kondisi bagian mobil dalam Bahasa Indonesia.",
            },
          },
          required: ["status", "description"],
        },
      },
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (result && (result.status === 'good' || result.status === 'not-good') && typeof result.description === 'string') {
        return result;
    } else {
        throw new Error("Invalid JSON structure received from API.");
    }

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    // Return a default error state
    return {
      status: 'not-good',
      description: 'Gagal menganalisis gambar. Harap periksa secara manual.',
    };
  }
}