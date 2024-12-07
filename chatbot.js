const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const amqp = require('amqplib');
const client = new Client();

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
client.initialize();

async function sendMessageToQueue(queue, message) {
    try {
        const connection = await amqp.connect("amqp://guest:guest@localhost:5672");
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, { durable: true });
        const isSent = channel.sendToQueue(queue, Buffer.from(message));
        
        if (isSent) {
            console.log(`Mensagem enviada para a fila ${queue}: ${message}`);
          } else {
            console.log(`Falha ao enviar mensagem para a fila ${queue}`);
          }
        // Fecha a conexão
    await channel.close();
    await connection.close();

    } catch (error) {
        console.error(error);
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função que usamos para criar o delay entre uma ação e outra

client.on('message', async msg => {

    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola|teste)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ' Sou o assistente virtual da empresa tal. Como posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:\n\n1 - Como funciona\n2 - Valores dos planos\n3 - Benefícios\n4 - Como aderir\n5 - Outras perguntas'); //Primeira mensagem de texto

        await sendMessageToQueue('chatbot_messages', "Mensagem enviada para o cliente: ");

    }

    if (msg.body !== null && msg.body === '1' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Nosso serviço oferece consultas médicas 24 horas por dia, 7 dias por semana, diretamente pelo WhatsApp.\n\nNão há carência, o que significa que você pode começar a usar nossos serviços imediatamente após a adesão.\n\nOferecemos atendimento médico ilimitado, receitas\n\nAlém disso, temos uma ampla gama de benefícios, incluindo acesso a cursos gratuitos');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'COMO FUNCIONA?\nÉ muito simples.\n\n1º Passo\nFaça seu cadastro e escolha o plano que desejar.\n\n2º Passo\nApós efetuar o pagamento do plano escolhido você já terá acesso a nossa área exclusiva para começar seu atendimento na mesma hora.\n\n3º Passo\nSempre que precisar');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');

    }

    if (msg.body !== null && msg.body === '2' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, '*Plano Individual:* R$22,50 por mês.');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');
    }

    if (msg.body !== null && msg.body === '3' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Sorteio de em prêmios todo ano.\n\nAtendimento médico ilimitado 24h por dia.\n\nReceitas de medicamentos');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        console.log("Body", msg.body);
        console.log("From", msg.from);

    }

    if (msg.body !== null && msg.body === '4' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Você pode aderir aos nossos planos diretamente pelo nosso site ou pelo WhatsApp.\n\nApós a adesão, você terá acesso imediato');

        await delay(3000); //delay de 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Link para cadastro: https://site.com');

    }

    if (msg.body !== null && msg.body === '5' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        console.log("Body", msg.body);
        console.log("From", msg.from);

        await delay(3000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(3000);
        await client.sendMessage(msg.from, 'Se você tiver outras dúvidas ou precisar de mais informações, por favor, fale aqui nesse whatsapp ou visite nosso site: https://site.com ');

    }

});