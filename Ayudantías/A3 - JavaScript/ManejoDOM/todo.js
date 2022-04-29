// Definimos el título de la página
const titleString = "To-Do 📔";

// Definimos la información a mostrar
const data = [
  { id: 1245, content: "Estudiar Autómatas 🤖" },
  { id: 1243, content: "Estudiar Flui2 💀" },
  { id: 9425, content: "Prepapar AY-04 Infovis 📚" },
  { id: 1222, content: "Estudiar Distribuidos 👹" },
];

// Obtenemos el div del título y lo centramos
const titleDiv = document.getElementById("title");
titleDiv.style.textAlign = "center";

// Creamos el elemento h1 y le agregamos el título
const titleH1 = document.createElement("h1");
titleH1.append(titleString);

// Agregamos el h1 al div del título
titleDiv.append(titleH1);

// Obtenemos el div de la lista y lo centramos
const listDiv = document.getElementById("list");
listDiv.style.textAlign = "center";

// Por cada string en data creamos un párrafo y le agregamos el texto
const dataP = data.map((d) => {
  const p = document.createElement("p");
  p.setAttribute("id", d.id);
  p.append(d.content);
  return p;
});

// Agregamos los parrafos a la lista
listDiv.append(...dataP);
