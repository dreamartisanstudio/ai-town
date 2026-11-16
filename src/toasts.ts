import { toast } from 'react-toastify';

export async function toastOnError<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error: any) {
    toast.error(error.message);
    // Callers are async event handlers that don't catch; swallowing here keeps
    // a failed input from becoming an unhandled rejection (pageerror).
    console.warn('Input failed', error);
    return undefined;
  }
}
