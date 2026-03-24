# EXPLICACIÓN DETALLADA: INTEGRACIÓN FRONTEND Y BACKEND (LOGIN)

A continuación, te detallo paso a paso cómo configuramos la comunicación entre la interfaz de Next.js y la base de datos de Laravel, simulando los "pantallazos" con los fragmentos exactos de código que creamos.

---

## 1. PREPARACIÓN DE LA BASE DE DATOS (LARAVEL)
Por defecto, el sistema de Login de Laravel busca una tabla llamada `users` y una contraseña llamada `password`. Como nosotros creamos un diseño de base de datos más robusto, tuvimos que "enseñarle" a Laravel a usar NUESTRA estructura.

### Lo que modificamos en el Modelo (Backend):
En el archivo `backend/app/Models/User.php`:
```php
class User extends Authenticatable
{
    // 1. Le decimos que nuestra tabla real se llama diferente:
    protected $table = 't1_licenses_users';

    // 2. Le indicamos qué campos existen:
    protected $fillable = ['role_id', 'full_name', 'email', 'password_hash', 'is_active'];

    // 3. ¡EL TRUCO VITAL! Le decimos que la contraseña no se llama 'password'
    public function getAuthPassword() {
        return $this->password_hash;
    }
}
```

---

## 2. EL CEREBRO DE VALIDACIÓN (AUTH CONTROLLER)
Necesitábamos una "puerta" (API) que recibiera los datos desde Next.js, verificara la base de datos y devolviera un permiso. 

Creamos el archivo `backend/app/Http/Controllers/AuthController.php` e hicimos una ruta en `routes/api.php` (`/api/login`).

### ¿Cómo valida Laravel los datos?
```php
// 1. Busca el usuario en la BD donde el email coincida con lo que el usuario tipeó
$user = User::where('email', $request->email)->first();

// 2. Hash::check() compara la contraseña encriptada (Azuladh@ra25 -> jd83j3#2...)
if (! $user || ! Hash::check($request->password, $user->password_hash)) {
    // Si falla, devuelve un error 401 a Next.js
    return response()->json(['message' => 'Usuario o contraseña incorrectos.'], 401);
}

// 3. Si acierta, generamos el "Token de Sesión" (La llave virtual)
$token = $user->createToken('lazarus-auth-token')->plainTextToken;
return response()->json(['token' => $token, 'user' => $user], 200);
```

---

## 3. CÓMO ENVÍA LOS DATOS EL FRONTEND (NEXT.JS)
En la parte visual (`frontend/app/page.tsx`), necesitamos "capturar" lo que el usuario teclea (usuario y contraseña) usando variables de estado (React `useState`).

### La Captura:
```tsx
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');

// En los campos HTML (Inputs), usamos el "onChange" para guardar cada letra que escribes:
<input value={username} onChange={(e) => setUsername(e.target.value)} />
```

### El Envío (La Petición Fetch):
Cuando presionas el botón "Ingresar", se detiene que la página recargue automáticamente (`e.preventDefault()`) y Next.js usa una función interna de Javascript llamada `fetch` para "lanzar" los datos hacia el backend.

```tsx
// Esta porción dispara los datos al backend (El momento de la verdad)
const response = await fetch('http://127.0.0.1:8000/api/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    // Convertimos las variables username y password en puro texto JSON para viajar por internet
    body: JSON.stringify({ email: username, password: password }),
});

const data = await response.json();
```

---

## 4. LA REACCIÓN DEL FRONTEND A LA BD
Una vez que el backend (Paso 2) procesa la solicitud, devuelve la respuesta a Next.js (La variable `response`).

```tsx
if (!response.ok) {
    // Si devolvió el Error 401 o 403 (Contraseña mala)
    // Mostramos la alerta roja y cortamos la animación
    setErrorMsg('Usuario o contraseña incorrectos');
    setIsLoading(false); 
} else {
    // Si devolvió el 200 OK (¡Login Exitoso!)
    setSuccess(true);
    
    // GUARDAMOS localmente en tu Chrome/Edge la llave de seguridad (Token)
    localStorage.setItem('lazarus-token', data.token);

    // Lanzamos la animación Lottie 3 segundos y luego entramos
    setTimeout(() => {
        alert("Entrando al dashboard...");
    }, 3000);
}
```

### RESUMEN DEL FLUJO COMPLETO:
1. Escribes `JulianH11` y `Azuladh@ra25`. Next.js lo guarda en Memoria Válatil (`useState`).
2. Le das al botón. Next.js dispara una "bala" (Petición Fetch POST) portando { email, password } hacia el puerto 8000.
3. Laravel ataja la bala. Desencripta la info, consulta a MySQL (`t1_licenses_users`), mira que `Hash::check()` sea correcto y que tu cuenta esté activa.
4. Laravel fabrica un pase VIP (Token) y se lo arroja de vuelta al puerto 3000.
5. Next.js ataja el Token. Dibuja la alerta verde, esconde el formulario, y guarda el token en una "caja fuerte" (LocalStorage) del navegador del cliente para recordarlo en el Dashboard.
