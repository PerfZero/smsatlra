import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

interface PersonData {
  name: string;
  iin: string;
  service?: string;
  amount?: string;
  date?: string;
  paymentId?: string;
  phone?: string;
}

function extractPersonData(text: string): PersonData | null {
  try {
    // Проверяем наличие ИИН/ИНН в письме
    let iinMatch = text.match(/(?:ИИН|ИНН)\s*:?\s*(\d+)/i);
    // Если не найден в стандартном формате, ищем ИИН в формате "ИИН отдыхающего:"
    if (!iinMatch) {
      iinMatch = text.match(/(?:ИИН|ИНН) отдыхающего\s*:?\s*(\d+)/i);
    }
    // Ищем в формате Kaspi
    if (!iinMatch) {
      iinMatch = text.match(/ЖСН\|ИИН\|ИИН\s*=\s*(\d+)/i);
    }
    
    if (!iinMatch) {
      return null;
    }

    const iin = iinMatch[1].trim();
    
    // Поиск ФИО отдыхающего
    let nameMatch = text.match(/ФИО отдыхающего\s*:?\s*([^\n]+)/i);
    
    // Поиск суммы платежа разными способами
    const amountMatch = text.match(/Платеж на сумму\s*:?\s*([0-9.,]+)/i);
    
    // Поиск услуги
    let serviceMatch = text.match(/Услуга\s*:?\s*([^\n,]+)/i);
    if (!serviceMatch) {
      serviceMatch = text.match(/Услуга\s*:?\s*([^,]+)/i);
    }
    
    // Поиск даты в разных форматах
    let dateMatch = text.match(/Дата\s*:?\s*(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})/i);
    if (!dateMatch) {
      dateMatch = text.match(/(\d{2}\.\d{2}\.\d{4}\s+\d{2}:\d{2}:\d{2})/i);
    }
    
    // Поиск ID платежа
    let paymentIdMatch = text.match(/Идентификатор платежа\s*:?\s*(\d+)/i);
    if (!paymentIdMatch) {
      paymentIdMatch = text.match(/(?:ID|номер) платежа\s*:?\s*(\d+)/i);
    }
    
    // Поиск телефона
    let phoneMatch = text.match(/(?:телефон|тел|phone)\s*:?\s*(\+?[0-9]+)/i);
    // Поиск телефона в формате Kaspi
    if (!phoneMatch) {
      phoneMatch = text.match(/Телефон нөмірі\|Номер телефона\s*=\s*(\d+)/i);
    }
    
    return {
      name: nameMatch ? nameMatch[1].trim() : "Не указано",
      iin: iin,
      service: serviceMatch && serviceMatch[1] ? serviceMatch[1].trim() : "Не указано",
      amount: amountMatch ? amountMatch[1].trim() : undefined,
      date: dateMatch ? dateMatch[1].trim() : new Date().toLocaleString('ru-RU'),
      paymentId: paymentIdMatch ? paymentIdMatch[1].trim() : `MANUAL-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      phone: phoneMatch ? phoneMatch[1].trim() : undefined
    };
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
}

async function processPaymentText() {
  // Текст платежа, который нужно обработать
  const paymentText = `Услуга: Atlas Save
                ФИО отдыхающего: Алдаберген Елдос Елібайұлы
                ИИН отдыхающего: 980919300267
                Платеж на сумму: 26000.00
                Дата: 12.05.2025 15:54:38
                Идентификатор платежа: 11351531535
                Параметры:
        ЖСН|ИИН|ИИН =  980919300267
        Телефон нөмірі|Номер телефона = 7477830560`;
  
  // Извлекаем данные
  const personData = extractPersonData(paymentText);
  
  if (!personData) {
    console.log("Не удалось извлечь данные из текста платежа");
    return;
  }
  
  // Выводим результат
  console.log("Извлеченные данные:");
  console.log("------------------");
  console.log(`ФИО: ${personData.name}`);
  console.log(`ИИН: ${personData.iin}`);
  console.log(`Услуга: ${personData.service}`);
  console.log(`Сумма: ${personData.amount}`);
  console.log(`Дата: ${personData.date}`);
  console.log(`ID платежа: ${personData.paymentId}`);
  console.log(`Телефон: ${personData.phone}`);
  
  try {
    // Проверяем, существует ли пользователь с таким ИИН
    let user = await prisma.user.findUnique({
      where: { iin: personData.iin }
    });
    
    if (user) {
      console.log("\nПользователь найден в базе данных:");
      console.log(`ID: ${user.id}`);
      console.log(`Имя: ${user.name}`);
      console.log(`ИИН: ${user.iin}`);
      console.log(`Телефон: ${user.phone}`);
      
      // Обновляем имя пользователя
      if (personData.name !== "Не указано" && user.name === "Не указано") {
        const updatedUser = await prisma.user.update({
          where: { iin: personData.iin },
          data: { 
            name: personData.name,
            phone: personData.phone || user.phone
          }
        });
        
        console.log("\nИмя пользователя обновлено:");
        console.log(`Новое имя: ${updatedUser.name}`);
        console.log(`Новый телефон: ${updatedUser.phone}`);
      } else {
        console.log("\nОбновление не требуется или имя уже указано");
      }
    } else {
      // Создаем нового пользователя
      console.log("\nСоздаем нового пользователя...");
      
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const newUser = await prisma.user.create({
        data: {
          name: personData.name,
          iin: personData.iin,
          phone: personData.phone || `7${personData.iin.substring(0, 10)}`,
          password: hashedPassword,
          role: 'USER'
        }
      });
      
      console.log("Пользователь успешно создан:");
      console.log(`ID: ${newUser.id}`);
      console.log(`Имя: ${newUser.name}`);
      console.log(`ИИН: ${newUser.iin}`);
      console.log(`Телефон: ${newUser.phone}`);
      console.log(`Временный пароль: ${randomPassword}`);
    }
  } catch (error) {
    console.error("Ошибка при обработке пользователя:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем обработку текста платежа
processPaymentText().then(() => {
  console.log("\nОбработка завершена");
}); 