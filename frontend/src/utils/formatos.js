// Código do produto como plaqueta de peça: 1 -> "#0001". Usado na tabela, nos cartões e no modal.
export const formatarCodigo = (id) => `#${String(id).padStart(4, '0')}`;
