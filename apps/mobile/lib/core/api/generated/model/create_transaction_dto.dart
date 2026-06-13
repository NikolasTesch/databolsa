/// Model gerado — payload para POST /assets/:id/transactions.
/// Todos os valores monetários são String (conforme CreateTransactionDto no backend).
class CreateTransactionDtoGenerated {
  final String type; // 'BUY' | 'SELL'
  final String date;
  final String unitPrice;
  final String quantity;
  final String? fees;

  const CreateTransactionDtoGenerated({
    required this.type,
    required this.date,
    required this.unitPrice,
    required this.quantity,
    this.fees,
  });

  Map<String, dynamic> toJson() => {
        'type': type,
        'date': date,
        'unit_price': unitPrice,
        'quantity': quantity,
        if (fees != null) 'fees': fees,
      };
}
