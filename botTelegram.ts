import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';


// Este es el token del bot. NO LO TOQUES O NO FUNCIONARÁ. POR FAVOR. ¡¡¡QUE NO LO TOQUES!!!
const token = '6021834143:AAGemZdEuSEr4JcTWhn6B51XYK37cf4onW0';

// Crea una nueva instancia del bot
const bot = new TelegramBot(token, { polling: true });

// Escucha los mensajes entrantes. Esto es para comprobar que funciona
/** 
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Responde al mensaje
  bot.sendMessage(chatId, '¡Hola desde tu bot de Telegram en TypeScript!');
});
*/

const listaQuedada: string[] = []; // Array para almacenar los nombres de los asistentes
const listaConsolas: string[] = []; // Array para almacenar la penya que trae Switch con juego
function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
} // Esto es para retrasar los mensajes y que se envíen en el orden correcto. Se ve que la naturaleza asíncrona de Telegram es muy capulla a veces

// Escucha el comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Mensaje de respuesta al comando /start
    const responseOne = '¡Hola! Espero que no os pille desprevenidos. ¡Soy SmashMalagaBot! El nombre es horrible, lo sé, pero mi creador, Asancu., está falto de ideas y no se le ocurrió otro, el muy bobo.';
    const responseTwo = '¡Actuaré como secretario y os ayudaré a gestionar la lista de quedadas! Podéis escribir: \n /proximaquedada Esto generará la lista de asistentes para la nueva quedada. \n /apuntame Apúntate a la próxima quedada. \n /quitame Quítate de la quedada si al final no puedes o no quieres asistir. \n /ruleset Echa un ojo al ruleset oficial de Smash Málaga.'
    const responseThree = 'Gente, estoy en una fase muy temprana de desarrollo y puede que haya errores. Estoy bastante nervioso y no sé cómo saldrá esto, pero cualquier sugerencia podéis escribir a Asancu. o manifestarla por aquí. \n **Desarrolladores**, si estáis interesados, ¡puedo subirme a GitHub! A ver si entre todos podéis ponerme a punto como es debido... \n\n ¡Sed buenos!'

    // Enviar la respuesta al comando /start
    async function enviarMensajesApuntado(chatId: number) {
        try {
            await bot.sendMessage(chatId, responseOne);
            await bot.sendMessage(chatId, responseTwo);
            await bot.sendMessage(chatId, responseThree);
        } catch (error) {
            console.error('Creo que he petado... A ver si entiendes esto: ' + error) // Esperemos que esta línea nunca triggeree. No debería. No DEBE.
        }
    }
    enviarMensajesApuntado(chatId);
});

// OJO A ESTO, QUE PUEDE QUE NO FURULE BIEN CONFORME PASE EL MES SIGUIENTE XD:

const fechaQuedada = fechaProximaQuedada();

function fechaProximaQuedada() {
    const hoy = new Date();
    const proximaQuedada = new Date(); // Creamos un nuevo objeto fecha
    const diaSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; // Array con días de la semana
    const mes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; // Array con los meses

    proximaQuedada.setDate(hoy.getDate() + 6)

    // Devolvemos la fecha futura
    return `${diaSemana[proximaQuedada.getDay()]}, ${proximaQuedada.getDate()} de ${mes[proximaQuedada.getMonth()]} de ${proximaQuedada.getFullYear()}`;

}

// Función para generar la lista para la próxima quedada
function generarListaQuedada() {

    const textoQuedada =
        `🕔 Quedada el ${fechaQuedada}, a las 4:30 PM (hasta las 8:30 PM)
    🏛 La Ciénaga Hobby Shop (C. Leopoldo Alas "Clarín", 3, 29002 Málaga) - https://goo.gl/maps/9VE1Wp85apkyCpjW6
    💵 4€ por persona

    👥 Asistentes (${listaQuedada.length} apuntados):
    ${listaQuedada.join('\n')}

    Traen consola estos ${listaConsolas.length} héroes (recuerda que es 1 setup por 2 viciaos):
    ${listaConsolas.join('\n')}

    Recuerda: Puedes apuntarte escribiendo en el chat "/apuntame". 
    ¿No puedes ir? ¡Escribe "/quitame"! 
    ¿Quieres ver la lista? "/proximaquedada".
    `;
    // Aquí se envía el texto de la lista a través del bot de Telegram
    // utilizando el método bot.sendMessage
    // bot.sendMessage(chatId, textoQuedada);

    return textoQuedada; // Devuelve la lista enterita
};

// Comando para apuntarse a la quedada
bot.onText(/\/apuntame/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from?.username || msg.from?.first_name; // Se utiliza el username si está disponible, de lo contrario se utiliza el nombre
    const gifPath = 'assets/images/vamooo.mp4'; // Ruta de la imagen 

    // Verificar si el usuario ya está apuntado a la quedada
    if (userName && listaQuedada.includes(userName)) {
        bot.sendMessage(chatId, 'Ya estabas en la quedada desde el principio, ¡pero haces bien en asegurarte!');
    } else if (userName && !listaQuedada.includes(userName)) {
        listaQuedada.push(userName);

        async function enviarMensajesApuntado(chatId: number, userName: string) {
            try {
                await bot.sendAnimation(chatId, gifPath, { caption: 'Te has apuntado a la quedada. ¡Buen trabajo!', duration: 1 })
                await bot.sendMessage(chatId, 'Cargando nueva lista:');
                await delay(500);
                await bot.sendMessage(chatId, generarListaQuedada());
                bot.sendMessage(chatId, `¡Ah, lo olvidaba! ¿Traes consola, ${userName}? Si es así, escribe o haz click en /apuntarSeta.`)
            } catch (error) {
                console.error('Creo que he petado... A ver si entiendes esto: ' + error) // Esperemos que esta línea nunca triggeree. No debería. No DEBE.
            }
        }

        if (userName == "kaekkuga") {
            bot.sendMessage(chatId, ('LMAO TÚ NO VAS NI DE COÑA JAJAJAJAJAJA'))
        }
        enviarMensajesApuntado(chatId, userName);
    }
})

bot.onText(/\/apuntarSeta/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from?.username || msg.from?.first_name; // Se utiliza el username si está disponible, de lo contrario se utiliza el nombre

    // Verificar si el usuario ya apuntó setup
    if (userName && listaConsolas.includes(userName)) {
        bot.sendMessage(chatId, 'Ya traes setup.');
    } else if (userName && !listaConsolas.includes(userName)) {
        listaConsolas.push(userName + `🍄`);

        bot.sendMessage(chatId, '¡Qué gran noticia! Ahí va una consolita. Cargando nueva lista:');
        bot.sendMessage(chatId, generarListaQuedada());
    }
})

bot.onText(/\/quitarSeta/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from?.username || msg.from?.first_name; // Se utiliza el username si está disponible, de lo contrario se utiliza el nombre

    if (userName && listaConsolas.includes(userName)) {
        const index = listaConsolas.indexOf(userName);
        if (index !== -1) {
            listaConsolas.splice(index, 1); // Eliminar el nombre del usuario de la lista
            bot.sendMessage(chatId, '¡Pues habrá que ponerse a hacer cola! 😰 \n Consola eliminada.');
        }
    }
});

bot.onText(/\/proximaquedada/, (msg) => {
    const chatId = msg.chat.id;
    const listaQuedada = generarListaQuedada();
    bot.sendMessage(chatId, listaQuedada);
});

bot.onText(/\/quitame/, (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from?.username || msg.from?.first_name;

    // Verificar si el usuario está en la lista de asistentes
    if (userName && listaQuedada.includes(userName)) {

        const index = listaQuedada.indexOf(userName);
        if (index !== -1) {
            listaQuedada.splice(index, 1); // Eliminar el nombre del usuario de la lista
            listaConsolas.splice(index, 1);

            const photoPath = 'assets/images/pringao.jpg'; // Ruta de la imagen 

            bot.sendPhoto(chatId, photoPath, { caption: '"Ahora todos sabrán lo rajao que eres"' })
                .then(() => {
                    console.log('Imagen enviada con éxito');
                    bot.sendMessage(chatId, `¡Es una lástima que no puedas ir, ${userName}! 😥 \n Te has quitado de la quedada. /apuntame para inscribirte de nuevo.`);

                })
                .catch((error) => {
                    console.error('Error al enviar la imagen:', error);
                });

        } else {
            bot.sendMessage(chatId, '¿¡Cómo quieres que te quite si NO estás en la lista en primer lugar!?');
        }

    }
});

bot.onText(/\/aiuda/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "¿Necesitas saber qué comandos puedes usar? ¡Yo te lo recuerdo! \n Podéis escribir: \n /proximaquedada Esto generará la lista de asistentes para la nueva quedada. \n /apuntame Apúntate a la próxima quedada. \n /quitame Quítate de la quedada si al final no puedes o no quieres asistir. \n /ruleset Imprime una imagen del reglamento oficial en el que jugamos con su stagelist actual en Smash Málaga.");
})

// Escucha el evento de nuevos miembros en el grupo
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    // Iterar sobre los nuevos miembros
    newMembers?.forEach((member) => {
        const memberName = member.username || member.first_name;
        const newChallengerImgPath = "assets/images/newChallenger.gif"
        bot.sendAnimation(chatId, newChallengerImgPath);

        const holaIllo =
            `¡Se acerca un nuev@ contrincante! ¡Te doy la bienvenida al grupo de Smash Málaga, ${memberName}! Espero que disfrutes de tu estancia.
        \n Hacemos quedadas todos los fines de semana. ¡Simplemente escribe /proximaquedada y sigue las indicaciones!`;

        // Enviar el mensaje de bienvenida al nuevo miembro
        bot.sendMessage(chatId, holaIllo);
    });
});

// Gracias a cron, este método limpiará y generará una nueva lista vacía para la quedada de la siguiente semana.
// Se genera al minuto 0, a la hora 0, cualquier día del mes (*), cualquier mes (*), el domingo (0)).

// Es decir, cada domingo a las doce de la noche ya tienes una nueva lista completamente vacía.
cron.schedule('0 0 * * 0', () => {
    listaQuedada.length = 0;
    // Aquí se genera la lista para la próxima quedada y se almacena en el array
    generarListaQuedada();

})

// Esto enviará el ruleset europeo con la imagen del stagelist de Tech Republic IV. Bastante simple.
bot.onText(/\/ruleset/, (msg) => {
    const rulesetPath = 'assets/images/ruleset.jpg'; // Ruta de la imagen 
    const chatId = msg.chat.id;

    bot.sendPhoto(chatId, rulesetPath, { caption: 'Aquí tienes el ruleset oficial. Se juega a 3 stocks 7 minutos y los bans son 3-4-1. No olvides quitar la pausa para que el Asancu de turno no haga ragequit.' });
    bot.sendMessage(chatId, "Escribe /fullruleset para explicarte el procedimiento completo.")
})

bot.onText(/\/fullruleset/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `1️⃣ Empieza haciendo piedra papel tijeras, a lo Alex Kidd. Quien gane, será el primero en banear 3 escenarios.\n
        2️⃣Luego, el perdedor baneará otros 4 escenarios.\n
        3️⃣Ahora, el ganador eligirá en qué escenario jugar de los dos restantes.\n
        4️⃣El ganador de la ronda baneará 3 escenarios donde NO jugar.\n
        5️⃣El perdedor de la ronda elegirá en qué escenario SÍ jugar de los seis que quedan.\n
        6️⃣Repite los pasos 4 y 5 hasta que el set por fin termine.
        `)
    bot.sendMessage(chatId, "NOTA: Antes de empezar con el ban de escenarios, decid qué personaje jugaréis al unísono.")
})

// VIVA MÁLAGA Es broma. Código por Asancu.
// Colaboradores (esta es la parte en la que metes tu nombre si quieres, aunque solo hayas cambiado un pedacico de código, toda ayuda es bien agradecida):
//