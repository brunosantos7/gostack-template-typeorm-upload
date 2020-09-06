import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, In } from 'typeorm';
import Transaction from '../models/Transaction';
import CategoryRepository from '../repositories/CategoryRepository';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';


type CsvTransaction = {
  title: string,
  value: number,
  type: "outcome" | "income",
  category: string
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(CategoryRepository);

    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      from_line: 2,
    })

    const transactions: CsvTransaction[] = [];
    const categories: string[] = [];

    const parseCsv = contactsReadStream.pipe(parsers);
    parseCsv.on("data", async line => {
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim()
      )

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({ title, type, value, category })
    })

    await new Promise(resolve => parseCsv.on("end", resolve));

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories)
      }
    })

    const existentCategoriesTitle = existentCategories.map((category: Category) => {
      return category.title;
    })

    const categoriesToCreate = categories
      .filter(category => !existentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index)


    let newCategories: Category[] = [];
    let allCategories: Category[] = [];

    if (categoriesToCreate && categoriesToCreate.length > 0) {
      newCategories = await categoryRepository.create(
        categoriesToCreate.map(title => ({
          title
        }))
      )
      await categoryRepository.save(newCategories)

      allCategories = [...newCategories, ...existentCategories]
    } else {
      allCategories = [...existentCategories]
    }


    const createdTransactions = await transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        value: transaction.value,
        type: transaction.type,
        category: allCategories.find(item => item.title === transaction.category)
      }))
    )

    const allTransactions = await transactionRepository.save(createdTransactions);

    await fs.promises.unlink(filePath);

    return allTransactions;
  }
}

export default ImportTransactionsService;
