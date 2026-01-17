//PARAMETROS//
const querystring = window.location.search;
const urlParameters = new URLSearchParams(querystring);

// Animación y layout
const animationSpeed = urlParameters.get("animationSpeed") || "0.1";
const lineSpacing = urlParameters.get("lineSpacing") || "1.7";

// Fondo
const colorFondo = urlParameters.get("fondoColor") || "#000000";
const opacity = urlParameters.get("opacidad") || 0.3;

// Visibilidad
const showAvatar    = obtenerBooleanos("mostarAvatar", true);
const showTimestamp = obtenerBooleanos("mostrarTiempo", true);
const showUsername  = obtenerBooleanos("mostrarUsuario", true);
const showBadges    = obtenerBooleanos("mostrarInsigneas", true);
const showImages    = obtenerBooleanos("mostrarImagenes", true);

// Roles
const rolUsuario = urlParameters.get("rolesId") || "4";
const mensajesAgrupados = obtenerBooleanos("mensajesAgrupados", true);

// Auto-ocultar
let ocultarDespuesDe = urlParameters.get("tiempoMs") || 0;

// Eventos
const showRedeemMessages = obtenerBooleanos("mostrarCanjes", false);
const destacado         = obtenerBooleanos("mostrarDestacado", false);
const showCheerMessages = obtenerBooleanos("mostrarMensajesBits", false);
const showRaidMessage   = obtenerBooleanos("mostrarRaids", false);

// Emotes / comandos
const showGiantEmotes = obtenerBooleanos("mostrarEmotesGigantes", false);
const excludeCommands = obtenerBooleanos("excluirComandos", true);

// Fuente
const fuenteLetra = urlParameters.get("fuenteLetra") || "consolas";
let fontSize = urlParameters.get("tamanoFuente") || "24";

// Usuarios ignorados
const ignoredUsers = urlParameters.get("usuariosIgnorados") || "";

// Streamerbot
const StreamerbotPort    = urlParameters.get("portInput") || "8080";
const StreamerbotAddress = urlParameters.get("hostInput") || "127.0.0.1";


const minRole = 3;
const maxMessages = 20;
let totalMessages = 0;
let ultimoUsuario = '';
const avatarHashMap = new Map();

const hexToRgb = (hex) => {
  const cleanHex = hex.replace("#", "");
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const { r, g, b } = hexToRgb(colorFondo);

document.body.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
document.body.style.fontFamily = fuenteLetra;
document.body.style.fontSize = `${fontSize}px`;

const listaMensajes = document.getElementById("listaMensajes");
listaMensajes.classList.add("scrollNormal");

document.documentElement.style.setProperty('--line-spacing', `${lineSpacing}em`);
document.documentElement.style.setProperty('--animation-speed', `${animationSpeed}s`);

//CLIENTE//
const client = new StreamerbotClient({
    host: StreamerbotAddress,
    port: StreamerbotPort,
    onConnect: (data) =>{
        console.log(data);
        setConnectionStatus(true);
    },
    onDisconnect: () =>{
        setConnectionStatus(false);
    }
});

//TWITCH
client.on('Twitch.ChatMessage', (response) => {
    MensajeChat(response.data);
})

client.on('Twitch.RewardRedemption', (response) => {
    RecompensaChat(response.data);
})

client.on('Twitch.Cheer', (response) => {
    CheerChat(response.data);
})

client.on('Twitch.Follow', (response) => {
	TwitchFollow(response.data);
})

client.on('Twitch.ChatCleared', (response) => {
	LimpiarChat(response.data);
})

client.on('Twitch.UserBanned', (response) => {
    UsuarioBaneado(response.data);
})

client.on('Twitch.UserTimedOut', (response) => {
    UsuarioBaneado(response.data);
})

//YOUTUBE

client.on('YouTube.Message', (response) => {
	console.log(response);
	MensajeYoutube(response.data);
})

//MENSAJE DE CHAT//
async function MensajeChat(data) {
	console.log(data);

	const destacado = data.message.isHighlighted;
	const usuario = data.user.name;
	const uid = data.message.userId;
	const role = data.user.role;
	const color = data.user.color;
	const msgId = data.message.msgId;
	const mensaje = data.text;
	const esRespuesta = data.message.isReply;

	if (data.message.message.startsWith("!") && excludeCommands) return;
	
	if (ignoredUsers.includes(usuario)) return;

	const plantilla = document.getElementById("plantillaMensaje");

	const instancia = plantilla.content.cloneNode(true);

	const mensajeContenedorDiv = instancia.querySelector("#mensajeContenedor");
	mensajeContenedorDiv.classList.add("bubble");
	const primerMensajeDiv = instancia.querySelector("#primerMensaje");
	const chatCompartidoDiv = instancia.querySelector("#chatCompartido");
	const chatCompartidoCanalDiv = instancia.querySelector("#chatCompartidoCanal");
	const respuestaDiv = instancia.querySelector("#respuesta");
	const respuestaUsuarioDiv = instancia.querySelector("#respuestaUsuario");
	const respMsgDiv = instancia.querySelector("#respMsg");
	const userInfoDiv = instancia.querySelector("#user-info");
	const avatarDiv = instancia.querySelector("#avatar");
	const timeStampDiv = instancia.querySelector("#timestamp");
	const badgesDiv = instancia.querySelector("#badges");
	const usuarioDiv = instancia.querySelector("#username");
	const mensajeDiv = instancia.querySelector("#mensaje");
	
	if (data.message.firstMessage) {
		primerMensajeDiv.style.display = 'block';
		mensajeContenedorDiv.classList.add("destacarPrimerMensaje");
	}

	if (destacado) {
		mensajeContenedorDiv.classList.add("rotar-color");
	}

	if (esRespuesta && data.message.reply) {
        const replyUser = data.message.reply.userName;
        const replyMsg = data.message.reply.msgBody;

		const maxChars = 40;

        respuestaDiv.style.display = 'block';
        respuestaUsuarioDiv.innerText = replyUser;
        respMsgDiv.innerText = truncarTexto(replyMsg, maxChars);
    }

	const now = new Date();
	const horas = String(now.getHours()).padStart(2, '0');
	const minutos = String(now.getMinutes()).padStart(2, '0');
	const time = `${horas}:${minutos}`;

	if (showTimestamp) {
		timeStampDiv.classList.add("timestamp");
		timeStampDiv.innerText = time;
	}

	if (showUsername) {
		usuarioDiv.innerText = usuario;
		usuarioDiv.style.color = color;
	}

	// Mostrar mensaje
	mensajeDiv.innerHTML = html_encode(mensaje);


	if (usuario === "DesarolladorCheems") mensajeDiv.style.color = "#3BE477";


	if (showBadges) {
		badgesDiv.innerHTML = "";
		for (let i in data.message.badges) {
			const badge = new Image();
			badge.src = data.message.badges[i].imageUrl;
			badge.classList.add("badge");
			badgesDiv.appendChild(badge);
		}
	}

	// Reemplazar emotes
	for (let i in data.emotes) {
		const emoteElement = `<img src="${data.emotes[i].imageUrl}" class="emote"/>`;
		const emoteName = EscapeRegExp(data.emotes[i].name);
		let regexPattern = /^\w+$/.test(emoteName)
			? `\\b${emoteName}\\b`
			: `(?<=^|[^\\w])${emoteName}(?=$|[^\\w])`;
		const regex = new RegExp(regexPattern, 'g');
		mensajeDiv.innerHTML = mensajeDiv.innerHTML.replace(regex, emoteElement);
	}

	// Bits cheer
	for (let i in data.cheerEmotes) {
		const bits = data.cheerEmotes[i].bits;
		const imageUrl = data.cheerEmotes[i].imageUrl;
		const name = data.cheerEmotes[i].name;
		const cheerEmoteElement = `<img src="${imageUrl}" class="emote"/>`;
		const bitsElements = `<span class="bits">${bits}</span>`;
		const cheerRegex = new RegExp(`\\b${name}${bits}\\b`, 'i');
		mensajeDiv.innerHTML = mensajeDiv.innerHTML.replace(cheerRegex, cheerEmoteElement + bitsElements);
	}

	// Avatar
	if (showAvatar) {
		const avatarURL = await obtenerAvatar(usuario);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Agrupación por usuario
	if (mensajesAgrupados && listaMensajes.children.length > 0) {
		if (ultimoUsuario === data.user.id) {
			userInfoDiv.style.display = "none";
			avatarDiv.style.visibility = "hidden";
			avatarDiv.style.height = "0px";
		}
	}

	ultimoUsuario = data.user.id;

	const imgRegex = /^https?:\/\/.+\.(gif|png|jpg|jpeg|webp)(\?.*)?$/i;
	const isUrl = /^https?:\/\//i.test(mensaje);
	const imgMatch = mensaje.match(imgRegex);

	let shouldAdd = true;

	if (isUrl && (!showImages || role < rolUsuario || rolUsuario === 0)) {
		console.warn("URL bloqueada (sin permiso):", mensaje);
		return;
	}

	if (isUrl && !imgMatch) {
		console.warn("URL bloqueada (no es imagen):", mensaje);
		return;
	}

	if (imgMatch) {
		shouldAdd = false;

		const cleanUrl = new URL(imgMatch[0]);
		cleanUrl.search = '';
		cleanUrl.hash = '';

		const image = new Image();

		image.onload = () => {
			image.style.width = "100%";
			image.style.borderRadius = "8px";
			image.style.marginTop = "6px";

			mensajeDiv.innerHTML = '';
			mensajeDiv.appendChild(image);

			agregarMensaje(instancia, msgId, uid);
		};

		image.onerror = () => {
			console.warn("Imagen no pudo cargarse:", cleanUrl.toString());
		};

		image.src = "https://external-content.duckduckgo.com/iu/?u=" + cleanUrl.toString();
	}

	if (shouldAdd) {
		agregarMensaje(instancia, msgId, uid);
	}
}

async function RecompensaChat(data) {
	console.log(data);
	const costo = data.reward.cost;
	const titulo = data.reward.title;
	const usuario = data.user_name;
	const uid = data.user_id;
	const rewardId = data.id;

	const plantilla = document.getElementById("plantillaReward");
	const instancia = plantilla.content.cloneNode(true);

	const mensajeContenedorDiv = instancia.querySelector("#rewardContenedor");
	const avatarDiv = instancia.querySelector("#avatar");
	const usuarioDiv = instancia.querySelector("#reward");

	// Estilo personalizado
	mensajeContenedorDiv.style.position = "relative";
	mensajeContenedorDiv.style.height = "100%";
	mensajeContenedorDiv.style.background = "linear-gradient(90deg,rgba(175, 133, 237, 0.95) 0%, rgba(129, 80, 204, 1) 50%, rgba(119, 44, 232, 1) 100%)";
	mensajeContenedorDiv.style.marginBottom = "5px"; // ← Separación entre rewards

	// Agregar avatar si está habilitado
	if (showAvatar) {
		const avatarURL = await obtenerAvatar(usuario);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	// Contenido del mensaje
    usuarioDiv.style.fontFamily = fuenteLetra;
    usuarioDiv.style.fontSize ="28px";
	usuarioDiv.innerHTML = `${usuario} ha canjeado ${titulo} <img id="channel_point" src="./icon/channel-point.png"/> ${costo}`;

	agregarMensaje(instancia, rewardId, uid);
	
}

async function CheerChat(data){
    console.log(data);
    const bits = data.bits;
    const usuario = data.user.name;
    const uid = data.user.userId;
    const msgId = data.message.msgId;
    const mensaje = data.text;
    const emotes = data.emotes;

    if(data.message.message.startsWith("!"))
        return;

    const plantilla = document.getElementById("plantillaReward");
	const instancia = plantilla.content.cloneNode(true);

    const mensajeContenedorDiv = instancia.querySelector("#rewardContenedor");
	const avatarDiv = instancia.querySelector("#avatar");
    const usuarioDiv = instancia.querySelector("#reward");
	
    mensajeContenedorDiv.style.position = "relative";
	mensajeContenedorDiv.style.height = "100%";
	mensajeContenedorDiv.classList.add("rotar-color-cheers");
	//mensajeContenedorDiv.style.background = "linear-gradient(90deg,rgba(175, 133, 237, 0.95) 0%, rgba(129, 80, 204, 1) 50%, rgba(119, 44, 232, 1) 100%)";
	mensajeContenedorDiv.style.marginBottom = "5px"; // ← Separación entre rewards


	if (showAvatar) {
		const avatarURL = await obtenerAvatar(usuario);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}
	
    usuarioDiv.className = "usuario";
    usuarioDiv.innerHTML = `${usuario} ha donado ${bits} <img id="cheers" src="${data.parts[0].imageUrl}"/>`;

    agregarMensaje(instancia, msgId, uid);
}

async function TwitchFollow(data) {
	console.debug(data);
	const usuario = data.user_name;
	const uid = data.user_id;

	const plantilla = document.getElementById("plantillaReward");
	const instancia = plantilla.content.cloneNode(true);

    const mensajeContenedorDiv = instancia.querySelector("#rewardContenedor");
	const avatarDiv = instancia.querySelector("#avatar");
    const usuarioDiv = instancia.querySelector("#reward");

	 mensajeContenedorDiv.style.position = "relative";
	mensajeContenedorDiv.style.height = "100%";
	mensajeContenedorDiv.classList.add("rotar-color-cheers");
	//mensajeContenedorDiv.style.background = "linear-gradient(90deg,rgba(175, 133, 237, 0.95) 0%, rgba(129, 80, 204, 1) 50%, rgba(119, 44, 232, 1) 100%)";
	mensajeContenedorDiv.style.marginBottom = "5px"; // ← Separación entre rewards


	if (showAvatar) {
		const avatarURL = await obtenerAvatar(usuario);
		const avatar = new Image();
		avatar.src = avatarURL;
		avatar.classList.add("avatar");
		avatarDiv.appendChild(avatar);
	}

	usuarioDiv.className = "usuario";
    usuarioDiv.innerHTML = `${usuario} ha comenzado a seguir el canal/>`;

	agregarMensaje(instancia, null, uid);
}

function LimpiarChat(data) {
    console.log(data);
	listaMensajes = document.getElementById("listaMensajes");

	while (listaMensajes.firstChild) {
		listaMensajes.removeChild(listaMensajes.firstChild);
	}
}

function UsuarioBaneado(data) {
    console.log(data);
	listaMensajes = document.getElementById("listaMensajes");
	const messagesToRemove = [];

	const userId = data.targetUser.id;

	for (let i = 0; i < listaMensajes.children.length; i++) {
		if (listaMensajes.children[i].dataset.userId === userId) {
			messagesToRemove.push(listaMensajes.children[i]);
		}
	}

	messagesToRemove.forEach(item => {
		listaMensajes.removeChild(item);
	});
}

//FUNCIONES HELPER
function agregarEmotes(message){
    let text = html_encode(message.text);
    let emotes = message.emotes;

    text = text.replace(/([^\s]*)/gi, 
        function (m, key){
            let result = emotes.filter(emote => {
                return emote.name === key
            });
            if(typeof result[0] !== "undefined"){
                let url = result[0]['imageUrl'];
                return `<img alt="" src="${url}" id="emotes"/>`;
            }else return key;
        }
    );
    return text;
}

function html_encode(e) {
    return e.replace(/[<>"^]/g, function (e) {
        return "&#" + e.charCodeAt(0) + ";";
    });
}

async function obtenerAvatar(username){
    let response = await fetch('https://decapi.me/twitch/avatar/'+username);
    let data = await response.text();
    return data;
}

function obtenerBooleanos(parametro, valor){
    const urlParams = new URLSearchParams(window.location.search);

    console.log(urlParams);

    const valorParametro = urlParams.get(parametro);

    if(valorParametro === null){
        return valor;
    }

    if(valorParametro === 'true'){
        return true;
    }else if(valorParametro === 'false'){
        return false;
    }else{
        return valor;
    }
}

function EscapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function agregarMensaje(instancia, msgId, uid) {

	const tempDiv = document.getElementById("calcularAltura");
	const tempDivToo = document.createElement('div');
	tempDivToo.appendChild(instancia);
	tempDiv.appendChild(tempDivToo);

	setTimeout(function (){
		const alturaCalculada = tempDivToo.offsetHeight+"px";
		var listItem = document.createElement('li');
		listItem.id = msgId;
		listItem.dataset.userId = uid;

		listItem.appendChild(tempDiv.firstElementChild);

		listaMensajes.appendChild(listItem);

		setTimeout(function (){
			listItem.className = listItem.className + " show";
			listItem.style.maxHeight = alturaCalculada;

			setTimeout(function (){
				listItem.style.maxHeight = "none";
			}, 1000);
		}, 10);

		while(listaMensajes.clientHeight > 5 * window.innerHeight){
			listaMensajes.removeChild(listaMensajes.firstChild);
		}

		if (ocultarDespuesDe > 0) {
			setTimeout(() => {
				listItem.style.opacity = 0;
				setTimeout(() => {
					if (listItem.parentNode) listItem.parentNode.removeChild(listItem);
				}, 1000);
			}, ocultarDespuesDe * 1000);
		}

	}, 200);

}

function truncarTexto(texto, max) {
    if (!texto) return "";
    return texto.length > max
        ? texto.slice(0, max).trim() + "…"
        : texto;
}


//ESTADO DE CONEXION A STREAMERBOT//
function setConnectionStatus(connected){
    let statusContainer = document.getElementById('status-container');
    if(connected){
        statusContainer.style.background = "#2FB774";
        statusContainer.innerText = "STREAMERBOT ONLINE!";
        statusContainer.style.opacity = 1;
        setTimeout(() => {
            statusContainer.style.transition = "all 2s ease";
            statusContainer.style.opacity = 0;
        }, 1000);
    }else{
        statusContainer.style.background = "FF0000";
        statusContainer.innerText = "STREAMERBOT OFFLINE...";
        statusContainer.style.transition = "";
        statusContainer.style.opacity = 1;
    }
}
