Consideraciones:

- La página fue diseñada para verse correctamente en las resoluciones comunes de notebooks y PCs de escritorio de hoy en día.
- Para resoluciones menores (por ejemplo en dispositivos móviles), existe un margen de adaptabilidad, pero fuera de eso la 
  página deja de ser RESPONSIVE.
- Por todo esto, se recomienda probarla en pantallas de alta resolución para maximizar su usabilidad.
- Para poder aprovechar la herramienta al 100% se recomienda estar conectado a internet.
- La herramienta está en Inglés, pensada para apelar a una mayor cantidad de usuarios.
- Se utilizaron los dataset del siguiente link: https://www.kaggle.com/nikdavis/steam-store-games, los que fueron preprocesados para generar el dataset único que se
 encuentra en la carpeta data/.

Preprocesamiento:

- Se utilizó la librería pandas de python (python 3.8)
- Se unieron los datos relevantes de todos los videojuegos en un sólo dataset, mediante joins entre los datasets originales
- Para las reviews positivas y negativas se derivó la proporción entre ellas, eliminando los datos originales que contenían la cantidad total
- Los precios se pasaron a USD