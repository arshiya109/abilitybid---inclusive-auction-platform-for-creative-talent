// Indian Rupee format
export const formatCurrency = (amount) => {
  if (amount == null || amount === '') return '₹0';
  const num = Number(amount);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
};
