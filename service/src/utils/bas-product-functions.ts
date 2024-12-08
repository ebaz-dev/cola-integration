export async function convertCapacity(capacity: string): Promise<number> {
  if (!capacity) {
    return 0;
  }

  if (typeof capacity !== "string") {
    return 0;
  }

  if (capacity.endsWith("ml")) {
    return parseInt(capacity.replace("ml", ""), 10);
  } else if (capacity.endsWith("L")) {
    return parseFloat(capacity.replace("L", "")) * 1000;
  } else {
    return 0;
  }
}

export async function barcodeSanitizer(barcode: string): Promise<string> {
  return barcode.trim().replace(/^[\s.]+|[\s.]+$/g, "");
}

export const eventDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
