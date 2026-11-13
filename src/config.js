// Configuración del buzón de sugerencias.
//
// La web es estática (GitHub Pages), así que los mensajes se envían a través de
// Web3Forms, que los reenvía al correo con el que se pidió la clave.
// Cómo conseguir la clave: entra en https://web3forms.com, escribe tu correo y
// te llega una «Access Key» por email. Pégala aquí. Es pública por diseño:
// solo sirve para enviarte mensajes a ti y no da acceso a tu correo.
export const SUGGESTIONS = {
  endpoint: "https://api.web3forms.com/submit",
  accessKey: "",
};
