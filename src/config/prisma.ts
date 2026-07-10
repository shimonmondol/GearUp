// Express Route Handler-এর উদাহরণ
export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params; // এটি string

  const user = await prisma.user.findUnique({
    where: { 
      id: parseInt(id, 10) // ✅ string থেকে integer-এ রূপান্তর
    },
  });
  
  // ... বাকি কোড
};