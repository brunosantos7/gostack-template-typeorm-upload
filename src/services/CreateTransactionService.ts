import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoryRepository from '../repositories/CategoryRepository';

type CreateTransactionDTO = { title: string, value: number, type: "income" | "outcome", category: string }

class CreateTransactionService {
  public async execute({ title, value, type, category }: CreateTransactionDTO): Promise<Transaction> {
    const transactionRepoisoty = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(CategoryRepository);

    const { total } = await transactionRepoisoty.getBalance();

    if (type === "outcome" && total < value) {
      throw new AppError("You do not have enough balance.");
    }

    let categoryRecord = await categoryRepository.findOne({
      where: {
        title: category
      }
    })

    if (!categoryRecord) {
      categoryRecord = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryRecord);
    }

    const transaction = transactionRepoisoty.create({ title, value, type, category: categoryRecord });

    await transactionRepoisoty.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
