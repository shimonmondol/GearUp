import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in .env file');
    }
    
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    return; // 👈 সফল হলে void রিটার্ন নিশ্চিত করে
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred', error);
    }
    process.exit(1); // এখানে কোড এক্সিকিউশন বন্ধ হয়ে যায়
  }
};

export default connectDB;