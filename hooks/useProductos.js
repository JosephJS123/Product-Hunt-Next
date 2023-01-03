import React from "react";
import { useState, useEffect, useContext } from "react";
import { collection, getDocs, orderBy } from "firebase/firestore";
import { FirebaseContext } from "../firebase";

const useProductos = (orden) => {
  const [productos, setProductos] = useState([]);

  const { firebase } = useContext(FirebaseContext);

  useEffect(() => {
    const obtenerProductos = async () => {
      const querySnapshot = await getDocs(
        collection(firebase.db, "productos"),
        orderBy(orden, "desc")
      );
      const productos = querySnapshot.docs.map((doc) => {
        return {
          id: doc.id,
          ...doc.data(),
        };
      });
      setProductos(productos);
    };
    obtenerProductos();
  }, []);

  return {
    productos
  }
};

export default useProductos;
