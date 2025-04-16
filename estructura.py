import os

# 🔧 Configura aquí
directorio_raiz = '.'  # Carpeta actual, puedes poner la ruta que desees
elementos_excluidos = {
    'venv', '__pycache__', '.git', 'node_modules', 'xdata', 'sandbox',
    '.gitignore', 'README.md', 'requirements.txt', '.vscode', 'out',
    'xdata','.vscodeignore', 'codebase', 'estructura.py'
}
salida = 'estructura.txt'

def generar_estructura(ruta, prefijo=''):
    estructura = ''
    try:
        contenido = os.listdir(ruta)
    except PermissionError:
        return estructura  # Evita errores por falta de permisos

    # 🔍 Excluye carpetas y archivos definidos
    contenido = [nombre for nombre in contenido if nombre not in elementos_excluidos]
    contenido.sort()

    for i, nombre in enumerate(contenido):
        ruta_completa = os.path.join(ruta, nombre)
        es_ultimo = (i == len(contenido) - 1)
        conector = '└── ' if es_ultimo else '├── '
        estructura += prefijo + conector + nombre + '\n'

        if os.path.isdir(ruta_completa):
            nuevo_prefijo = prefijo + ('    ' if es_ultimo else '│   ')
            estructura += generar_estructura(ruta_completa, nuevo_prefijo)

    return estructura

if __name__ == '__main__':
    estructura = generar_estructura(directorio_raiz)
    with open(salida, 'w', encoding='utf-8') as f:
        f.write(estructura)
    print(f'📁 Estructura de carpetas generada en "{salida}"')
