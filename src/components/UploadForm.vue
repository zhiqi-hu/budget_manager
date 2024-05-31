<template>
  <div class="container"
    :style="{ maxWidth: queryResult && queryResult.length ? '100vw' : '800px', marginTop: queryResult && queryResult.length ? '' : '100px', height: queryResult && queryResult.length ? '100vh' : '' }"
    style="overflow: hidden;">
    <div class="flex-container">

      <div style="width: 100%">
        <img class="skp-logo" src="/src/templates/logo-pink.png" alt="SKP Logo">
        <h1>销售计划导入</h1>
        <form class="upload-form" @submit.prevent="submitForm" enctype="multipart/form-data">
          <label>
            选择预算类型:
            <select v-model="selectedBudgetType" required>
              <option value="" disabled selected>选择预算类型</option>
              <option value="appraisal">考核预算</option>
              <option value="sprint">冲刺预算</option>
            </select>
          </label>
          <label>
            选择文件:
            <input type="file" @change="handleFileChange" accept=".xlsx, .xls" required>
          </label>
          <input type="submit" value="上传">
        </form>
        <div v-if="message" class="message">{{ message }}</div>

        <h2>查询数据</h2>
        <form class="query-form" @submit.prevent="queryData">
          <div class="form-row">
            <label>
              选择查询类型:
              <select v-model="queryBudgetType" required>
                <option value="" disabled selected>选择预算类型</option>
                <option value="appraisal">考核预算</option>
                <option value="sprint">冲刺预算</option>
              </select>
            </label>
            <label>
              年月:
              <input v-model="queryNy" type="text" required>
            </label>
            <label>
              门店编号:
              <input v-model="queryFdbh" type="number" required>
            </label>
          </div>
          <input type="submit" value="查询">
        </form>
      </div>
      <div v-if="queryResult && queryResult.length" class="query-result">
        <h3>查询结果:</h3>
        <div style="height:700px;overflow: auto;">
          <table class="result-table">
            <thead>
              <tr>
                <th v-for="header in tableHeaders" :key="header">{{ header }}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in queryResult" :key="rowIndex">
                <td v-for="header in tableHeaders" :key="header">{{ row[header] }}</td>
                <td><button @click="deleteRow(row, rowIndex)">删除</button></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button @click="prevPage" :disabled="pageNumber === 1">上一页</button>
          <span>第 {{ pageNumber }} 页</span>
          <button @click="nextPage" :disabled="queryResult.length < pageSize">下一页</button>
          <div>

            每页条数:
            <input v-model="pageSize" type="number" min="1" @change="queryData">

          </div>
        </div>

      </div>
      <div class="footer">
      &copy; 2024 北京SKP
    </div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';

export default {
  data() {
    return {
      selectedBudgetType: '',
      selectedFile: null,
      message: '',
      pageTitle: '销售计划上传',
      queryBudgetType: '',
      queryNy: '',
      queryFdbh: null,
      pageNumber: 1,
      pageSize: 10,
      queryResult: [],
      tableHeaders: []
    };
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
    },
    async submitForm() {
      if (!this.selectedBudgetType || !this.selectedFile) {
        this.message = '请选择预算类型并选择文件';
        return;
      }

      const formData = new FormData();
      formData.append('budgetFile', this.selectedFile);
      formData.append('budgetType', this.selectedBudgetType);
      document.title = this.pageTitle;
      try {
        const response = await axios.post('/upload/uploadFile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.status === 200) {
          this.message = '上传成功';
        } else {
          this.message = '上传失败';
        }
      } catch (error) {
        this.message = `请求出错: ${error.message}`;
      }
    },
    async queryData() {
      if (!this.queryBudgetType || !this.queryNy || !this.queryFdbh) {
        this.message = '请填写查询类型、年月和门店编号';
        return;
      }

      try {
        const response = await axios.get('/upload/getBudgetList', {
          params: {
            budgetType: this.queryBudgetType,
            ny: this.queryNy,
            fdbh: this.queryFdbh,
            pageNum: this.pageNumber,
            pageSize: this.pageSize
          }
        });

        if (response.status === 200 && response.data.data.length) {
          this.queryResult = response.data.data;
          this.tableHeaders = Object.keys(response.data.data[0]);
        } else {
          this.queryResult = [];
          this.message = '没有查询到数据';
        }
      } catch (error) {
        this.queryResult = [];
        this.message = `请求出错: ${error.message}`;
      }
    },
    async deleteRow(row, rowIndex) {
      try {
        const response = await axios.delete('/upload/deleteBudgetList', {
          data: {
            budgetType: this.queryBudgetType,
            bmdm: row.bmdm,
            ny: row.ny,
            fdbh: row.fdbh,
            sbid: row.sbid,
            hth: row.hth
          }
        });

        if (response.status === 200) {
          this.queryResult.splice(rowIndex, 1);
        } else {
          this.message = '删除失败';
        }
      } catch (error) {
        this.message = `删除出错: ${error.message}`;
      }
    },
    prevPage() {
      if (this.pageNumber > 1) {
        this.pageNumber--;
        this.queryData();
      }
    },
    nextPage() {
      this.pageNumber++;
      this.queryData();
    }
  }
}
</script>
<style scoped>
.flex-container {
  display: flex;
  flex-direction: row;

}

.container {
  font-family: Arial, sans-serif;
  padding: 20px;
  background-color: #f4f4f4;
  border-radius: 10px;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
}

.skp-logo {
  display: block;
  margin: 0 auto 20px;
  width: 150px;
}

h1,
h2 {
  color: #333;
  text-align: center;
}

.upload-form,
.query-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

input[type="file"],
select,
input[type="submit"],
input[type="text"],
input[type="number"] {
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.message,
.query-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: auto;
  height: 100%;
  box-sizing: border-box;
}

.result-table {
  width: 100%;
  height: 80%;
  overflow: scroll;
  border-collapse: collapse;
}

.result-table th,
.result-table td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: left;
}

.result-table th {
  background-color: #f8f8f8;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.pagination input[type="number"] {
  width: 60px;
}

.footer {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}

button {
  padding: 5px 10px;
  border: none;
  background-color: #ff6666;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: #ff3333;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
