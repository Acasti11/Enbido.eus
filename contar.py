#!/usr/bin/env python3
import os
import sys

def contar_ficheros(ruta):
    """Cuenta ficheros recursivamente en una ruta, excluyendo directorios."""
    if not os.path.exists(ruta):
        return None, []

    total = 0
    ficheros = []
    for dirpath, dirnames, filenames in os.walk(ruta):
        for f in filenames:
            total += 1
            ficheros.append(os.path.join(dirpath, f))
    return total, ficheros

rutas = [
    "frontend/src",
    "backend/src"
]

total_general = 0

print("=" * 50)
print("CONTEO DE FICHEROS")
print("=" * 50)

for ruta in rutas:
    count, lista = contar_ficheros(ruta)
    if count is not None:
        total_general += count
        print(f"\n📁 {ruta}")
        print(f"   Ficheros: {count}")
        # Descomenta la siguiente línea si quieres ver la lista completa
        # for f in lista:
        #     print(f"      - {f}")
    else:
        print(f"\n❌ {ruta} → NO EXISTE")

print(f"\n{'=' * 50}")
print(f"TOTAL: {total_general} ficheros")
print("=" * 50)
