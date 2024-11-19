import { AbstractControl, ValidatorFn } from '@angular/forms';

export function cuilValidator(): ValidatorFn {
  return (control: AbstractControl) => {
    if (!control.value) return null;
    
    // Eliminar caracteres no numéricos y convertir a string
    const cuil = control.value.toString().replace(/\D/g, '');
    
    // Validar longitud
    if (cuil.length !== 11) {
      return { invalidLength: 'El CUIL debe tener 11 dígitos' };
    }

    // Convertir CUIL a array de números
    const cuilArray = cuil.split('').map(Number);
    
    // Obtener dígito verificador (último número)
    const verificador = cuilArray[10];

    // Multiplicadores para el cálculo
    const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    // Calcular suma de productos
    let suma = 0;
    for (let i = 0; i < multiplicadores.length; i++) {
      suma += cuilArray[i] * multiplicadores[i];
    }

    // Calcular dígito verificador esperado
    let digitoEsperado = 11 - (suma % 11);
    
    // Manejar casos especiales
    if (digitoEsperado === 11) {
      digitoEsperado = 0;
    } else if (digitoEsperado === 10) {
      // Si el resultado es 10, el CUIL es inválido
      return { invalidCheckDigit: 'CUIL inválido' };
    }

    // Comparar dígito calculado con el verificador
    if (verificador !== digitoEsperado) {
      return { 
        invalidCheckDigit: 'Dígito verificador inválido',
        expected: digitoEsperado,
        received: verificador
      };
    }

    // Validar que el tipo de CUIL sea válido (primeros dos dígitos)
    const tipo = parseInt(cuil.substring(0, 2));
    const tiposValidos = [20, 23, 24, 27, 30, 33, 34];
    
    if (!tiposValidos.includes(tipo)) {
      return { invalidType: 'Tipo de CUIL inválido' };
    }

    return null;
  };
}