function formatearNumero(numero) {
    return new Intl.NumberFormat("es-CL", {
        maximumFractionDigits: 6
    }).format(numero);
}

function mostrarResultado(mensaje) {
    document.getElementById("resultado").innerText = mensaje;
}

function formatearTexto(texto) {
    return texto
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function formatearMoneda(moneda) {
    const codigo = moneda.toUpperCase();

    if (typeof Intl.DisplayNames !== "function") {
        return codigo;
    }

    try {
        const nombresMonedas = new Intl.DisplayNames(["es"], { type: "currency" });
        const nombre = nombresMonedas.of(codigo);

        return nombre && nombre !== codigo ? `${codigo} - ${nombre}` : codigo;
    } catch (error) {
        return codigo;
    }
}

function crearOpcion(valor, texto) {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = texto;
    return opcion;
}

function llenarSelect(select, opciones) {
    select.innerHTML = "";

    opciones.forEach(([valor, texto]) => {
        select.appendChild(crearOpcion(valor, texto));
    });
}

function obtenerCategoriasUnidad() {
    return Object.keys(unidades).filter((categoria) => categoria !== "moneda");
}

function obtenerOpciones(categoria) {
    return Object.keys(unidades[categoria]).map((unidad) => [
        unidad,
        categoria === "moneda" ? formatearMoneda(unidad) : formatearTexto(unidad)
    ]);
}

function actualizarFuenteMonedas(esMoneda) {
    const fuenteMonedas = document.getElementById("fuente-monedas");

    if (esMoneda && typeof monedaInfo !== "undefined") {
        fuenteMonedas.innerText = `Tasas respecto al dolar actualizadas: ${monedaInfo.actualizadoUtc}`;
        return;
    }

    fuenteMonedas.innerText = "";
}

function actualizarSelectores() {
    const tipoConversion = document.getElementById("tipo-conversion").value;
    const categoria = document.getElementById("categoria");
    const grupoCategoria = document.getElementById("grupo-categoria");
    const origen = document.getElementById("origen");
    const destino = document.getElementById("destino");
    const labelOrigen = document.getElementById("label-origen");
    const labelDestino = document.getElementById("label-destino");
    const esMoneda = tipoConversion === "moneda";
    const categoriaSeleccionada = esMoneda ? "moneda" : categoria.value;

    grupoCategoria.hidden = esMoneda;
    grupoCategoria.classList.toggle("oculto", esMoneda);
    labelOrigen.innerText = esMoneda ? "Moneda origen:" : "Unidad origen:";
    labelDestino.innerText = esMoneda ? "Moneda destino:" : "Unidad destino:";

    llenarSelect(origen, obtenerOpciones(categoriaSeleccionada));
    llenarSelect(destino, obtenerOpciones(categoriaSeleccionada));

    if (esMoneda) {
        origen.value = "usd";
        destino.value = "clp";
    } else if (categoriaSeleccionada === "longitud") {
        origen.value = "metros";
        destino.value = "kilometros";
    }

    mostrarResultado("Resultado:");
    actualizarFuenteMonedas(esMoneda);
}
//HISTORIAL Y EXPORTACIÓN A CSV 
let historialConversiones = JSON.parse(localStorage.getItem("historial_conversiones")) || [];

function guardarEnStorage() {
    localStorage.setItem("historial_conversiones", JSON.stringify(historialConversiones));
}

function registrarHistorial(valor, origen, destino, resultado) {
    historialConversiones.push({
        valor: Number(valor),
        origen: origen.toUpperCase(),
        resultado: Number(resultado),
        destino: destino.toUpperCase(),
        fecha: new Date().toLocaleTimeString()
    });
    guardarEnStorage();
    actualizarVistaHistorial();
}

function actualizarVistaHistorial() {
    const lista = document.getElementById("lista-historial");
    const contador = document.getElementById("contador-historial");
    if (!lista) return;

    if (contador) contador.innerText = historialConversiones.length;

    lista.innerHTML = "";
    historialConversiones.slice().reverse().forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.valor} ${item.origen} = ${formatearNumero(item.resultado)} ${item.destino} (${item.fecha})`;
        lista.appendChild(li);
    });
}

function limpiarHistorial() {
    if (historialConversiones.length === 0) {
        alert("El historial ya está vacío.");
        return;
    }
    if (confirm("¿Estás seguro de que deseas borrar todo el historial?")) {
        historialConversiones.length = 0;
        guardarEnStorage();
        actualizarVistaHistorial();
    }
}

function exportarCSV() {
    if (historialConversiones.length === 0) {
        alert("No hay conversiones en el historial para exportar.");
        return;
    }

    let csvContent = "\uFEFFValor;Origen;Resultado;Destino;Hora\n";

    historialConversiones.forEach(item => {
        csvContent += `${item.valor};${item.origen};${item.resultado};${item.destino};${item.fecha}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "historial_conversiones.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function convertir() {
    const valor = document.getElementById("valor").value;
    const origen = document.getElementById("origen").value;
    const destino = document.getElementById("destino").value;

    try {
        const resultado = convertirUnidad(valor, origen, destino);
        const valorFormateado = formatearNumero(Number(valor));
        const resultadoFormateado = formatearNumero(resultado);

        mostrarResultado(
            `${valorFormateado} ${origen.toUpperCase()} = ${resultadoFormateado} ${destino.toUpperCase()}`
        );
        registrarHistorial(valor, origen, destino, resultado);
    } catch (error) {
        mostrarResultado(error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tipoConversion = document.getElementById("tipo-conversion");
    const categoria = document.getElementById("categoria");

    llenarSelect(
        categoria,
        obtenerCategoriasUnidad().map((nombreCategoria) => [
            nombreCategoria,
            formatearTexto(nombreCategoria)
        ])
    );

    categoria.value = "longitud";

    tipoConversion.addEventListener("change", actualizarSelectores);
    categoria.addEventListener("change", actualizarSelectores);
    actualizarSelectores();
    actualizarVistaHistorial();
});
