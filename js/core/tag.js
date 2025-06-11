class Tag {
  id: string;
  name: string;
  color: string;  // Дополнительное свойство для визуализации

  constructor(name: string, color: string = "#4CAF50") {
    this.id = crypto.randomUUID();
    this.name = name;
    this.color = color;
  }
}