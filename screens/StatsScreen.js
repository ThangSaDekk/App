import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DataTable, Text } from 'react-native-paper';

const StatisticsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống kê doanh thu</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Tên sản phẩm</DataTable.Title>
          <DataTable.Title numeric>Doanh thu</DataTable.Title>
        </DataTable.Header>

        <DataTable.Row>
          <DataTable.Cell>iPhone 12</DataTable.Cell>
          <DataTable.Cell numeric>12000000 VND</DataTable.Cell>
        </DataTable.Row>

        <DataTable.Row>
          <DataTable.Cell>Samsung Galaxy S20</DataTable.Cell>
          <DataTable.Cell numeric>9500000 VND</DataTable.Cell>
        </DataTable.Row>

        {/* Thêm các dòng dữ liệu khác tương tự */}

        {/* DataTable.Pagination có thể được thêm vào nếu cần */}
      </DataTable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default StatisticsScreen;
