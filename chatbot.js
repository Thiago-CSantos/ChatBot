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

const clientStates = {};

client.on('message', async msg => {
    try {
        const chatId = msg.from;
        const currentState = clientStates[chatId] ? clientStates[chatId].status : 'default';

        switch (currentState) {
            case "default":
                if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

                    const chat = await msg.getChat();
                    await chat.sendStateTyping(); // Simulando Digitação
                    const contact = await msg.getContact(); //Pegando o contato
                    const name = contact.pushname; //Pegando o nome do contato
                    await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + ` Sou o assistente virtual da empresa Trincha. 
                    \nComo posso ajudá-lo hoje? Por favor, digite uma das opções abaixo:
                    1 - Ver cardápio\n2 - Fazer Pedido`); //Primeira mensagem de texto

                }

                if (msg.body === "2") {
                    clientStates[chatId] = { status: "fazendoPedido", pedidos: [] };
                    const chat = await msg.getChat();
                    await chat.sendStateTyping();
                    await client.sendMessage(chatId, "Perfeito! Por favor, me diga o que você gostaria de pedir.");
                }

                break;

            case "fazendoPedido":
                // Verifica se o cliente ainda não tem o estado inicial
                if (!clientStates[chatId]) {
                    clientStates[chatId] = { status: "fazendoPedido", pedidos: [] };
                }

                const pedido = msg.body;

                if (pedido.match(/(finalizar)/i)) {
                    const pedidosFinalizados = clientStates[chatId].pedidos.join(", ");
                    await client.sendMessage(chatId, "Obrigado! Seu pedido foi registrado. Entraremos em contato em breve para confirmação.");

                    // Volta para o estado "default" e limpa a lista de pedidos
                    clientStates[chatId] = { status: "default", pedidos: [] };

                    const contact = await msg.getContact();
                    const name = contact.pushname;
                    await sendMessageToQueue('chatbot_messages', `Pedido recebido de ${name}: ${pedidosFinalizados}`);
                    break;
                }

                if (pedido.match(/(adicionar)/i)) {
                    // Pede para o cliente informar mais um item
                    await client.sendMessage(chatId, "Por favor, informe o próximo item que você gostaria de adicionar ao seu pedido.");
                    break;
                }

                // Adiciona o pedido à lista de pedidos no estado do cliente
                clientStates[chatId].pedidos.push(pedido);
                console.log(clientStates[chatId].pedidos);

                await client.sendMessage(chatId, `Recebi o seu pedido: "${pedido}". Caso queira adicionar mais itens, digite "adicionar". Ou digite "finalizar" para concluir.`);
                break;

            default:
                console.log(currentState);

                await client.sendMessage(chatId, "Desculpe, algo deu errado. Por favor, tente novamente.");
                clientStates[chatId] = { status: "default", pedidos: [] }; // Garante que o estado volte ao padrão
                break;
        }

    } catch (error) {
        console.error(error);
    }

});
