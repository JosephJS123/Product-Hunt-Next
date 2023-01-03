import React from "react";
import Link from "next/link";
import { useEffect, useContext, useState } from "react";
import { useRouter } from "next/router";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import es from "date-fns/locale/es";
import { FirebaseContext } from "../../firebase";
import {
  collection,
  getDoc,
  doc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import Layout from "../../components/layout/Layout";
import Error404 from "../../components/layout/404";
import { css } from "@emotion/react";
import styled from "@emotion/styled";
import { Campo, InputSubmit } from "../../components/ui/Formulario";
import Boton from "../../components/ui/Boton";

const ContenedorProducto = styled.div`
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 2fr 1fr;
    column-gap: 2rem;
  }
`;

const CreadorProducto = styled.p`
  padding: 0.5rem 2rem;
  background-color: #da552f;
  color: #fff;
  text-transform: uppercase;
  font-weight: bold;
  display: inline-block;
  text-align: center;
`;

const Producto = () => {
  const [producto, setProducto] = useState({});
  const [error, setError] = useState(false);
  const [comentario, setComentario] = useState({});
  const [consultarDB, setConsultarDB] = useState(true);

  // router para obtener el id actual
  const router = useRouter();
  const {
    query: { id },
  } = router;

  // context de firebase
  const { firebase, usuario } = useContext(FirebaseContext);

  useEffect(() => {
    if (id && consultarDB) {
      const obtenerProducto = async () => {
        const productoQuery = await doc(
          collection(firebase.db, "productos"),
          id
        );
        const producto = await getDoc(productoQuery);
        if (producto.exists()) {
          setProducto(producto.data());
          setConsultarDB(false);
        } else {
          setError(true);
          setConsultarDB(false);
        }
      };

      obtenerProducto();
    }
  }, [id]);

  if (Object.keys(producto).length === 0 && !error) return "Cargando...";

  const {
    comentarios,
    creado,
    descripcion,
    empresa,
    nombre,
    url,
    URLImage,
    votos,
    creador,
    haVotado,
  } = producto;

  // Administrar y validar los votos
  const votarProducto = async () => {
    if (!usuario) {
      return router.push("/login");
    }

    // obtener y sumar un nuevo voto
    const nuevoTotal = votos + 1;

    // verificar si el usuario actual ha votado
    if (haVotado.includes(usuario.uid)) return;

    // guardar el ID del usuario que ha votado
    const nuevoHanVotado = [...haVotado, usuario.uid];

    // actualizar en la base de datos
    const productoQuery = await doc(collection(firebase.db, "productos"), id);

    updateDoc(productoQuery, {
      votos: increment(nuevoTotal),
      haVotado: nuevoHanVotado,
    });

    // actualizar el state
    setProducto({
      ...producto,
      votos: nuevoTotal,
    });

    setConsultarDB(true); // hay un voto, por lo tanto consultar a la BD
  };

  // Funciones para crear Comentarios
  const comentarioChange = (e) => {
    setComentario({
      ...comentario,
      [e.target.name]: e.target.value,
    });
  };

  // identifica si el comentario es del creador del producto
  const esCreador = (id) => {
    if (creador.id == id) {
      return true;
    }
  };

  const agregarComentario = async (e) => {
    e.preventDefault();

    if (!usuario) {
      return router.push("/login");
    }

    //Informacion extra al comentario
    comentario.usuarioID = usuario.uid;
    comentario.usuarioNombre = usuario.displayName;

    //Tomar copia de comentarios y agregarlos al arreglo
    const nuevoComentarios = [...comentarios, comentario];

    //actualizar la DB
    const productoQuery = await doc(collection(firebase.db, "productos"), id);

    updateDoc(productoQuery, {
      comentarios: nuevoComentarios,
    });

    //Actualizar el state
    setProducto({
      ...producto,
      comentarios: nuevoComentarios,
    });

    setConsultarDB(true); // hay un comentario, por lo tanto consultar la BD
  };

  // funcion que revisa que el creador del producto sea el mismo que está autenticado
  const puedeBorrar = () => {
    if (!usuario) return false;

    if (creador.id === usuario.uid) return true;
  };

  // eliminar un producto de la base de datos
  const eliminarProducto = async () => {
    if (!usuario) {
      return router.push("/login");
    }

    if (creador.id !== usuario.uid) {
      return router.push("/");
    }

    try {
      // Eliminar Producto
      await deleteDoc(doc(firebase.db, "productos", id));
      // Eliminar imagen
      const storage = getStorage();
      const imgRef = ref(storage, URLImage);
      deleteObject(imgRef)
        .then(() => {
          // Imagen eliminada correctamente
        })
        .catch((error) => {
          console.log(error);
        });
      router.push("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Layout>
      <>
        {error ? (
          <Error404 />
        ) : (
          <div className="contenedor">
            <h1
              css={css`
                text-align: center;
                margin-top: 5rem;
              `}
            >
              {nombre}
            </h1>

            <ContenedorProducto>
              <div>
                <p>
                  Publicado hace:{" "}
                  {formatDistanceToNow(new Date(creado), { locale: es })}
                </p>
                <p>
                  Por: {creador.nombre} de {empresa}
                </p>

                <img src={URLImage} />
                <p>{descripcion}</p>

                {usuario && (
                  <>
                    <h2>Agrega tu comentario</h2>
                    <form onSubmit={agregarComentario}>
                      <Campo>
                        <input
                          type="text"
                          name="mensaje"
                          onChange={comentarioChange}
                        />
                      </Campo>
                      <InputSubmit type="submit" value="Agregar comentario" />
                    </form>
                  </>
                )}

                <h2
                  css={css`
                    margin: 2rem 0;
                  `}
                >
                  Comentarios
                </h2>

                {comentarios.length === 0 ? (
                  "Aún no hay comentarios"
                ) : (
                  <ul>
                    {comentarios.map((comentario, i) => (
                      <li
                        key={`${comentario.usuarioID}-${i}`}
                        css={css`
                          border: 1px solid #e1e1e1;
                          padding: 2rem;
                        `}
                      >
                        <p>{comentario.mensaje}</p>
                        <p>
                          Escrito por:
                          <span
                            css={css`
                              font-weight: bold;
                            `}
                          >
                            {" "}
                            {comentario.usuarioNombre}
                          </span>
                        </p>
                        {esCreador(comentario.usuarioID) && (
                          <CreadorProducto>Es Creador</CreadorProducto>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <aside>
                <Link target="_blank" href={url}>
                  <Boton bgColor="true">Visitar URL</Boton>
                </Link>

                <div
                  css={css`
                    margin-top: 5rem;
                  `}
                >
                  <p
                    css={css`
                      text-align: center;
                    `}
                  >
                    {votos} Votos
                  </p>

                  {usuario && <Boton onClick={votarProducto}>Votar</Boton>}
                </div>
              </aside>
            </ContenedorProducto>

            {puedeBorrar() && (
              <Boton onClick={eliminarProducto}>Eliminar Producto</Boton>
            )}
          </div>
        )}
      </>
    </Layout>
  );
};

export default Producto;
