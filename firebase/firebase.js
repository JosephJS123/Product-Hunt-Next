import { initializeApp } from "firebase/app";
import firebaseConfig from "./config";
import {
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

class Firebase {
  constructor() {
    const app = initializeApp(firebaseConfig);
    this.auth = getAuth();
    this.db = getFirestore(app);
    this.storage = getStorage(app);
  }

  // Registra un usuario
  async registrar(nombre, email, password) {
    const nuevoUsuario = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    return await updateProfile(nuevoUsuario.user, {
      displayName: nombre,
    });
  }

  // Iniciar sesion del usuario
  async login(email, password) {
    const usuarioLogin = await signInWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    console.log(usuarioLogin);

    // return await updateProfile(usuarioLogin.user, {
    //   displayName: email,
    // });
  }

  // Cierra la sesion del usuario
  async cerrarSesion() {
    await signOut(this.auth);
  }
}

const firebase = new Firebase();
export default firebase;
