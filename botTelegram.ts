import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';


// Este es el token del bot. NO LO TOQUES O NO FUNCIONARÁ. POR FAVOR. ¡¡¡QUE NO LO TOQUES!!!
const token = '6021834143:AAGemZdEuSEr4JcTWhn6B51XYK37cf4onW0';

// Crea una nueva instancia del bot
const bot = new TelegramBot(token, { polling: true });

// Estructura de los usuarios
interface myUser {
    user: TelegramBot.User;
    dias: myDay[];
    preferredName?: string;
};

// Datos de los días, sirven para establecer si un usuario lleva setup un día concreto
interface myDay {
    dia: string;
    setup: boolean;
}

var quedadaExists = false; // Variable para mandar mensajes concretos tanto a los usuarios como con cron
var listaQuedada: myUser[] = []; // Array para almacenar los nombres de los asistentes
//const listaConsolas: string[] = []; // Array para almacenar la peña que trae Switch con juego

const diaSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]; // Array con días de la semana
const mes = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]; // Array con los meses

// Escucha el comando /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    // Mensaje de respuesta al comando /start
    const responseOne = '¡Hola! Espero que no os pille desprevenidos. ¡Soy SmashMalagaBot! El nombre es horrible, lo sé, pero mi creador, Asancu., está falto de ideas y no se le ocurrió otro, el muy bobo.';
    const responseTwo = '¡Os ayudaré con las quedadas y más! Escribid /aiuda para más información.';
    const responseThree = 'Gente, estoy en una fase muy temprana de desarrollo y puede que haya errores. Estoy bastante nervioso y no sé cómo saldrá esto, pero cualquier sugerencia podéis escribir a Asancu. o manifestarla por aquí. \n **Desarrolladores**, si estáis interesados, ¡buscadme en GitHub! \n\n ¡Sed buenos!'

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

let fechasQuedada = ''; // Aquí van todos los días que pueda haber quedada según los admins

// Función para generar la lista para la próxima quedada
function generarListaQuedada() {
    let textoQuedada =
        `Quedada(s) de esta semana:

${fechasQuedada}
Podéis apuntaros a cualquier día
Recordad que el día con más asistentes será el elegido para quedar

🕔 16:30 - 20:30
🏛 La Ciénaga Hobby Shop (C. Leopoldo Alas "Clarín", 3, 29002 Málaga) - https://goo.gl/maps/9VE1Wp85apkyCpjW6
💵 4€ por persona\n`;

    for (let f of fechas) {  //Por cada fecha que pueda haber quedada se genera una lista de usuarios y setups
        textoQuedada +=
            `\n👥 Asistentes ${f.diaSemana} ${f.numeroDia}:\n`;

        for (const u of listaQuedada) {
            for (const d of u.dias) {
                if (d.dia === f.diaSemana) {
                    textoQuedada += '          - ' + (u.preferredName ? u.preferredName : u.user.username || u.user.first_name) + (d.setup ? ' 🍄' : '') + '\n';
                }
            }
        }
    }

    return textoQuedada; // Devuelve la lista enterita
};

// Comando para apuntarse a la quedada
bot.onText(/\/apuntame( +.*)*$/, (msg) => {
    const chatId = msg.chat.id;

    if (quedadaExists) {
        const user = msg.from;

        /*
        * IMPORTANTE
        *
        * El siguiente bloque de código se repite con pequeñas modificaciones en los métodos /quitame, /apuntarSeta y /quitarSeta.
        * 
        * La funcionalidad de todos esos comandos es prácticamente igual a excepción de las condiciones para agregar, quitar o modificar información
        * de los usuarios de la quedada. No se comentará lo que funcione de forma homóloga, sólo aquello que sea más específico de cada método
        */

        // Verificar si el usuario existe
        if (user) {
            let dias = msg.text?.replace('/apuntame', '');  // De aquí sacamos los días que se apunte el usuario, ej:   /apuntame viernes sabado

            if (dias && dias.length > 0) {   // Si el usuario ha puesto algo después del /apuntame, entra
                let apuntadoChanged = false;  // Variable para editar o no el mensaje fijado
                const arrayDias = dias.trim().split(' ')  // Sacamos los dias que haya puesto el usuario
                const actualDias = procesarDias(arrayDias, true)  // Comprobamos que sean días válidos, no sea que el usuario haya puesto /apuntame yogurt chorizo
                const userData = userApuntado(user);  // Comprobamos si el usuario ya estaba apuntado a algo
                if (actualDias.length > 0) {   // Si hay al menos un día válido, seguimos
                    if (userData.exists) {       // Si el usuario ya estaba apuntado, hay que hacer unas comprobaciones
                        for (const d of actualDias) {
                            let found = false;

                            for (const e of userData.dias) {            // En este bloque se comprueba si en los días que el usuario se ha apuntado a cosas
                                if (!found) {                           // están incluidos días que ha introducido con /apuntame
                                    found = d === e.dia;
                                }
                            }

                            if (found) {         // Si el día ya está incluido en sus días, se le avisa de que ya estaba apuntado
                                bot.sendMessage(chatId, `Ya estabas apuntad@ el ${d.toLowerCase()}, @${user.username || user.first_name}...`);
                            } else {            // Si no, se incluye en sus días y cambiamos la variable para editar el fijado
                                listaQuedada[userData.index].dias.push({ dia: d, setup: false });
                                apuntadoChanged = true;
                            }
                        }
                        if (apuntadoChanged) {    // Si ha habido cambios en el usuario, se edita el mensaje
                            bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada }).then(res => {
                                bot.sendMessage(chatId, `¡Estás dentro, @${user.username || user.first_name}!`);
                            });
                        }
                    } else {  // Si el usuario no estaba apuntado a nada, se le apunta a los días directamente
                        let diasData: myDay[] = [];
                        for (const d of actualDias) {
                            diasData.push({ dia: d, setup: false });
                        }
                        listaQuedada.push({ user: user, dias: diasData });  // Se introduce el nuevo usuario
                        bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada });  // Se edita el mensaje fijado
                        bot.sendMessage(chatId, `¡Vale, ya estás en la lista, @${user.username}!`)
                    }
                }
            } else {     // Si el usuario no incluye días, se le avisa
                bot.sendMessage(chatId, `¿Pero qué días quieres ir, @${user.username || user.first_name}? \n Recuerda: "/apuntame [día/s]".`);
            }
        }
    } else {      // Si no hay quedada creada, se le avisa
        bot.sendMessage(chatId, '¡Qué impaciente! ¡Aún no hay quedada creada! Espera a que el Staff crea una.');
    }
})

function procesarDias(dias: string[], byUsuario: boolean) {   // Función simple para comprobar si un día es válido, hay que ser muy terrorista para escribir mal los días de la semana
    const result: string[] = [];

    for (let d of dias) {
        for (let k of diaSemana) {
            const dNormalized = d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const kNormalized = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            if (dNormalized === kNormalized) {
                if (byUsuario && diaDisponible(k))
                    result.push(k);
                else if (!byUsuario)
                    result.push(k);
            }
        }
    }
    return result;
}

function diaDisponible(dia: string) {   // Función para ver si un día corresponde los establecidos por la quedada
    for (let f of fechas) {
        if (dia === f.diaSemana) {
            return true;
        }
    }
    return false;
}

function userApuntado(user: TelegramBot.User) {   // Función para saber si un usuario está apuntado a algún día
    for (let [index, u] of listaQuedada.entries()) {
        if (u.user.id === user.id) {
            return { exists: true, dias: u.dias, index: index };
        }
    }
    return { exists: false, dias: [], index: -1 };
}

bot.onText(/\/cambiarNick( +.*)*$/, (msg) => {  // Función para cambiarte el nick de TODAS las listas en las que estés, se puede cambiar múltiples veces (fiesta)
    const chatId = msg.chat.id;

    if (quedadaExists) {
        const user = msg.from;

        if (user) {
            let preferredName = msg.text?.replace('/cambiarNick', '').trim();

            const apuntado = userApuntado(user);
            if (apuntado.exists) {
                listaQuedada[apuntado.index].preferredName = preferredName;
                bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada });
                bot.sendMessage(chatId, `¡Nick cambiado @${user.username || user.first_name}!`);
                return;
            }
        }
    } else {
        bot.sendMessage(chatId, 'Vamos a ver, para cambiarte el nick, primero tiene que haber quedada...');
    }
})

bot.onText(/\/apuntarSeta( +.*)*$/, (msg) => {    // Función homóloga a /apuntame, cambiando las condiciones
    const chatId = msg.chat.id;

    if (quedadaExists) {
        const user = msg.from;

        if (user) {
            let dias = msg.text?.replace('/apuntarSeta', '');

            if (dias && dias.length > 0) {
                const arrayDias = dias.trim().split(' ')
                const actualDias = procesarDias(arrayDias, true)

                let diasData: myDay[] = [];
                const userData = userApuntado(user);


                if (actualDias.length > 0) {
                    if (userData.exists) {
                        diasData = userData.dias;
                        for (const d of actualDias) {
                            let found = false;
                            let dayIndex = -1;

                            for (const [index, e] of userData.dias.entries()) {
                                found = d === e.dia;
                                if (found) {
                                    dayIndex = index;
                                }
                            }

                            if (dayIndex >= 0) {
                                if (listaQuedada[userData.index].dias[dayIndex].setup) {
                                    bot.sendMessage(chatId, `Ya llevas setup el ${d.toLowerCase()}, @${user.username || user.first_name}...`);
                                    return;
                                } else {
                                    modificarSetup(userData.index, dayIndex, true);
                                }
                            } else {
                                diasData.push({ dia: d, setup: true });
                            }
                        }
                        bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada });
                        bot.sendMessage(chatId, `¡Setup apuntada, @${user.username || user.first_name}! Gracias por aportar material. 😊`);
                    } else {
                        for (const d of actualDias) {
                            diasData.push({ dia: d, setup: true });
                        }
                        listaQuedada.push({ user: user, dias: diasData });
                        bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada });
                    }
                }
            } else {
                bot.sendMessage(chatId, `¿Y qué días quieres llevar setup, @${user.username || user.first_name}? \n Recuerda: /apuntarSeta [día/s].`);
            }
        }
    } else {
        bot.sendMessage(chatId, '¡No hay quedada aún! De momento, juega con tu setup en casa, ¿vale?');
    }
})

function modificarSetup(index: number, dayIndex: number, setup: boolean) {  // Pequeña función para establecer si un usuario concreto lleva setup o no en un día concreto
    let user = listaQuedada[index];
    user.dias[dayIndex].setup = setup;
    listaQuedada[index] = user;
}

bot.onText(/\/quitarSeta( +.*)*$/, (msg) => {  // Función homóloga a /apuntarSeta. En este caso se puede asumir que es la función contraria y, en general, las condiciones estarán invertidas
    const chatId = msg.chat.id;

    if (quedadaExists) {
        const user = msg.from;

        if (user) {
            let dias = msg.text?.replace('/quitarSeta', '');

            if (dias && dias.length > 0) {
                let quitadoChanged = false;
                const arrayDias = dias.trim().split(' ')
                const actualDias = procesarDias(arrayDias, true)

                const userData = userApuntado(user);

                if (actualDias.length > 0) {
                    if (userData.exists) {
                        for (const d of actualDias) {
                            let found = false;
                            let dayIndex = -1;

                            for (const [index, e] of userData.dias.entries()) {
                                found = d === e.dia;
                                if (found) {
                                    dayIndex = index;
                                }
                            }

                            if (dayIndex >= 0) {
                                if (listaQuedada[userData.index].dias[dayIndex].setup) {
                                    modificarSetup(userData.index, dayIndex, false);
                                    quitadoChanged = true;
                                } else {
                                    bot.sendMessage(chatId, `No traías setup el ${d.toLowerCase()} de todos modos, @${user.username || user.first_name}...`);
                                }
                            } else {
                                bot.sendMessage(chatId, `No te apuntaste el ${d.toLowerCase()}, @${user.username || user.first_name}...`);
                            }
                        }
                        if (quitadoChanged) {
                            bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada }).then(res => {
                                bot.sendMessage(chatId, `¡Setup quitada, @${user.username || user.first_name}!`);
                            });
                        }
                    }
                    else {
                        bot.sendMessage(chatId, `No estás apuntado a ningún día, @${user.username || user.first_name}...`);
                    }
                }
            } else {
                bot.sendMessage(chatId, `¿Podrías especificar qué días no vas a llevar setup, @${user.username || user.first_name}? \n Recuerda: "/quitarSeta [día/s]".`);
            }
        }
    } else {
        bot.sendMessage(chatId, 'No necesitamos setup porque... ¡no hay ninguna quedada, ill@!');
    }
});

var idQuedada: number;

bot.onText(/\/proximaQuedada( +.*)*$/, (msg) => {
    const user = msg.from;
    const chatId = msg.chat.id;

    if (user) {
        bot.getChatMember(chatId, user.id).then((chatMember) => {
            if (chatId !== 1204113061)
                if (chatMember.status === "administrator" || chatMember.status === "creator") {
                    const dias = msg.text?.replace('/proximaQuedada ', '');

                    if (dias && dias.length > 0) {
                        const arrayDias = dias.trim().split(' ')
                        const actualDias = procesarDias(arrayDias, false)

                        if (actualDias.length > 0) {
                            fechas = [];
                            fechasQuedada = fechaProximaQuedada(actualDias);
                            listaQuedada = [];
                            quedadaExists = true;

                            if (fechas.length > 0) {
                                bot.sendMessage(chatId, generarListaQuedada()).then((message) => {
                                    idQuedada = message.message_id;
                                    bot.pinChatMessage(chatId, idQuedada, { disable_notification: true });
                                });
                            } else {
                                bot.sendMessage(chatId, 'No hay días válidos. Recuerda que solo valen los identificadores de los días de la semana (L M X J V S D) que aún no hayan pasado.')
                            }
                        }
                    } else {
                        bot.sendMessage(chatId, "Por favor, dime un día válido si no te importa... \n '/proximaQuedada sabado', por ejemplo.");
                    }
                }
                else {
                    bot.sendMessage(chatId, `Buen intento, @${user.username || user.first_name}, pero no eres admin ni mucho menos creador...`);
            } else {
                bot.sendMessage(chatId, `Lo siento, ¡esta función es exclusiva del grupo Smash Málaga, y solo pueden usarlo Admins!`);
            }
        });
    }
});

interface fecha {  // Estructura de las fechas
    diaSemana: string;
    numeroDia: number;
    mes: string;
}

let fechas: fecha[] = [];

function fechaProximaQuedada(dias: string[]) {  // Función que genera las fechas para cada indicador de /proximaQuedada
    for (let d of dias) {
        console.log(d);
        let q = diaSemana.indexOf(d);
        const nextFecha = calcularNumeroDia(q);   // Función que calcula los días y el mes de la quedada. Comprueba si te pasas del día máximo de del mes y salta al siguiente, reiniciando al día 1.

        if (nextFecha && !fechas.find(x => x.diaSemana === diaSemana[q])) {
            fechas.push({ diaSemana: diaSemana[q], numeroDia: nextFecha.dia, mes: mes[nextFecha.mes] });
        }

        fechas.sort((a, b) => {
            return diaSemana.indexOf(a.diaSemana) - diaSemana.indexOf(b.diaSemana);
        })
    }

    // Devolvemos las fechas futuras
    let textoFechas = '';
    for (let f of fechas) {
        textoFechas += `${f.diaSemana}, ${f.numeroDia} de ${f.mes}\n`;
    }
    return textoFechas;
}

function calcularNumeroDia(weekDay: number) {
    const hoy = new Date();
    let numToday = hoy.getDay() - 1;

    if (numToday < 0)  // Al cambiar el orden del array de días, por pura legibilidad, hacemos que el domingo sea el día 6
        numToday = 6;

    if (weekDay >= numToday) {
        let newDay = hoy.getDate() + (weekDay - numToday);    // Los días que faltan para la fecha serán la diferencia entre ese día y el día que se crea la lista

        let thisMonth = hoy.getMonth();        // Guardamos el mes
        let maxDay = -1;                        // maxDay establecerá el valor más alto en función del mes 28, 29, 30 o 31

        if (thisMonth === 1) {                  // 28 y 29 en febrero
            const anyo = hoy.getFullYear();
            if (anyo % 4 === 0) {
                anyo % 100 === 0 ? (anyo % 400 === 0 ? maxDay = 29 : maxDay = 28) : maxDay = 29;
            } else {
                maxDay = 28;
            }
        }
        else if (thisMonth === 3 || thisMonth === 5 || thisMonth === 8 || thisMonth === 10)   // 30 para abril, junio, septiembre y noviembre
            maxDay = 30;
        else                            // 31 para enero, marzo, mayo, julio, agosto, octubre y diciembre
            maxDay = 31;

        if (newDay > maxDay) {         // Si el día es mayor al límite, aumentamos en 1 el mes (o reiniciamos el año si es diciembre) y el nuevo día será la diferencia
            thisMonth++;
            if (thisMonth > 11) {
                thisMonth = 0;
            }
            newDay = newDay - maxDay;
        }

        return { dia: newDay, mes: thisMonth };
    }

    return null;
}
bot.onText(/\/quitame( +.*)*$/, (msg) => {  // Función homóloga a /apuntame. En este caso se puede asumir que es la función contraria y, en general, las condiciones estarán invertidas
    const chatId = msg.chat.id;

    if (quedadaExists) {
        const user = msg.from;
        if (user) {
            let dias = msg.text?.replace('/quitame', '');

            if (dias && dias.length > 0) {
                let quitadoChanged = false;
                const arrayDias = dias.trim().split(' ');
                const actualDias = procesarDias(arrayDias, true);

                const userData = userApuntado(user);


                if (actualDias.length > 0) {
                    if (userData.exists) {
                        for (const d of actualDias) {
                            let found = false;
                            let dayIndex = -1;

                            for (const [index, e] of userData.dias.entries()) {
                                found = d === e.dia;
                                if (found) {
                                    dayIndex = index;
                                }
                            }

                            if (dayIndex >= 0) {
                                listaQuedada[userData.index].dias.splice(dayIndex, 1);
                                quitadoChanged = true;
                                if (listaQuedada[userData.index].dias.length <= 0) {
                                    listaQuedada.splice(userData.index, 1);
                                }
                            } else {
                                bot.sendMessage(chatId, `Pero si no estás apuntado el ${d.toLowerCase()} @${user.username || user.first_name}...`);
                            }
                        }
                        if (quitadoChanged) {
                            bot.editMessageText(generarListaQuedada(), { chat_id: chatId, message_id: idQuedada }).then(res => {
                                bot.sendMessage(chatId, `¡Ya no estás en la quedada, @${user.username || user.first_name}! Esperamos verte en la próxima.`);
                            });
                        }
                    } else {
                        bot.sendMessage(chatId, `No estás apuntado a ningún día, @${user.username || user.first_name}...`);
                    }
                }
            } else {
                bot.sendMessage(chatId, `¿Y de qué días te quieres quitar, @${user.username || user.first_name}? \n Recuerda: "/quitame [día/s]"`);
            }
        }
    } else {
        bot.sendMessage(chatId, '¡Echa el freno, madaleno! ¡No se ha anunciado ninguna quedada!');
    }
});

bot.onText(/\/aiuda/, (msg) => {  // La misma función que tenías, ligeramente formateada y con la información nueva
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `¿Necesitas saber qué comandos puedes usar? ¡Hagamos memoria!

/proximaQuedada [días]
Esto generará la lista de asistentes para la semana (sólo admins) (Ejemplo: "/proximaQuedada viernes" o "/proximaQuedada viernes sabado").

/apuntame [días]
Apúntate a los días que puedas (separados por espacios) (Ejemplo: "/apuntame viernes", "/apuntame viernes sabado").

/quitame [días]
Quítate de los días que no vayas a asistir (separados por espacios) (Ejemplo: "/quitame viernes", "/quitame viernes sabado").

/apuntarSeta [días]
Apunta tu setup a los días que puedas llevarla (separados por espacios) (Ejemplo: "/apuntarSeta viernes", "/apuntarSeta viernes sabado").

/quitarSeta [días]
Quita tu setup de los días que no puedas llevarla (separados por espacios) (Ejemplo: "/quitarSeta viernes", "/quitarSeta viernes sabado").

/cambiarNick 'nuevo-nick'
Cambia el nick con el que aparecerás en todas las listas (Ejemplo: "/cambiarNick copixuelas" ).

/ruleset
Imprime una imagen del reglamento oficial en el que jugamos con su stagelist actual en Smash Málaga. /fullruleset para el procedimiento completo.`
    );
})

// Escucha el evento de nuevos miembros en el grupo
bot.on('new_chat_members', (msg) => {
    const chatId = msg.chat.id;
    const newMembers = msg.new_chat_members;

    // Iterar sobre los nuevos miembros
    newMembers?.forEach((member) => {
        const memberName = member.username || member.first_name;
        const newChallengerImgPath = "assets/images/newChallenger.gif"
        if (member.username != "smashmalaga_bot") { // Condicional para que no se dé la bienvenida así mismo. Eso es demasiado narcisista y está feo
            bot.sendAnimation(chatId, newChallengerImgPath);

            const holaIllo =
                `¡Nuev@ contrincante! ¡Te doy la bienvenida al grupo de Smash Málaga, @${memberName}! Espero que disfrutes de tu estancia. Recuerda que hacemos quedadas todos los fines de semana. 
                \n ¡Escribe /aiuda para saber qué puedes hacer!`;

            // Enviar el mensaje de bienvenida al nuevo miembro
            bot.sendMessage(chatId, holaIllo);
        } else {
            bot.sendMessage(chatId, "¡Estamos activos papi! ¡Hola a todo el mundo! 👋")
        }
    });
});

// Gracias a cron, este método limpiará y generará una nueva lista vacía para la quedada de la siguiente semana.
// Se genera al minuto 0, a la hora 0, cualquier día del mes (*), cualquier mes (*), el lunes (1)).

// Es decir, cada lunes a las doce de la noche ya tienes una nueva lista completamente vacía.
cron.schedule('0 0 * * 1', () => {
    quedadaExists = false;
    listaQuedada.length = 0;
    bot.sendMessage('-1001204113061', 'Nueva semana, ¡nueva lista!');
})

// Aquí igual, pero hacemos un recordatorio a los usuarios o a los admins de si hay quedada o no, los miércoles a las 16:00.
// El primer parámetro en los métodos sendMessage es el ID del Chat de Smash Málaga.
cron.schedule('0 16 * * 3', () => {
    if (quedadaExists) {
        bot.sendMessage('-1001204113061', '🎮 Recuerda que ya hay lista para quedar esta semana. Échale un vistazo a los mensajes fijados para ver los detalles.');
    } else {
        bot.sendMessage('-1001204113061', '⚠ Recordatorio para los admins: aún no se ha habilitado lista para quedada esta semana. Recordad que con "/proximaQuedada L M X J V S D" podéis hacerlo');
    }
})

// Esto enviará el ruleset europeo con la imagen del stagelist de Tech Republic IV. Bastante simple.
bot.onText(/\/ruleset/, (msg) => {
    const rulesetPath = 'assets/images/ruleset.jpg'; // Ruta de la imagen 
    const chatId = msg.chat.id;

    bot.sendPhoto(chatId, rulesetPath, { caption: 'Aquí tienes el ruleset oficial. Se juega a 3 stocks 7 minutos y los bans son 3-4-1.\n\nEscribe /fullruleset para explicarte el procedimiento completo.' });
})

bot.onText(/\/fullruleset/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId,
        `1️⃣ El orden de baneo se decide a piedra-papel-tijera. Quien gane, será el primero en banear 3 escenarios.

2️⃣ Luego, el perdedor baneará otros 4 escenarios.

3️⃣ Ahora, el ganador eligirá en qué escenario jugar de los dos restantes.

4️⃣ El ganador de la partida baneará 3 escenarios donde NO jugar.

5️⃣ El perdedor de la ronda elegirá en qué escenario SÍ jugar de los seis que quedan.

6️⃣ Repite los pasos 4 y 5 hasta terminar el set.
`)
    bot.sendMessage(chatId, "NOTA: Antes de empezar con el ban de escenarios, decid qué personaje jugaréis al unísono.")
})

bot.onText(/\/mamataoacuanto/, (msg) => {
    const chatId = msg.chat.id;
    const fechaHoy = new Date();
    bot.sendMessage(chatId, `Son las ${fechaHoy} es hora de jugar bajo presión`);
})

// VIVA MÁLAGA Es broma.
// Asancu (Código base)

// Colaboradores (esta es la parte en la que metes tu nombre si quieres, aunque solo hayas cambiado un pedacico de código, toda ayuda es bien agradecida):
// Karka https://github.com/jmmdev / https://jmmdev.github.io)  =) (Rework del código)

// Actualizado el 19 de junio