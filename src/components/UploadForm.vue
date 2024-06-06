<template>
  <div
    class="container"
    :style="{
      maxWidth: queryResult && queryResult.length ? '100vw' : '800px',
      marginTop: queryResult && queryResult.length ? '' : '0px',
      height: queryResult && queryResult.length ? 'auto' : ''
    }"
    style="overflow: auto"
  >
    <div class="flex-container">
      <div style="width: 100%">
        <img class="skp-logo" src="/src/templates/logo-pink.png" alt="SKP Logo" />
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
            <input type="file" @change="handleFileChange" accept=".xlsx, .xls" required />
          </label>
          <input type="submit" value="上传" />
        </form>

        <div style="height: auto" v-if="message" class="message">{{ message }}</div>

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
              查询年月:
              <input v-model="queryNy" type="text" required />
            </label>
            <label>
              门店名称:
              <select v-model="queryFdbh" required>
                <option value="" disabled selected>选择门店名称</option>
                <option v-for="store in storeNames" :key="store.fdbh" :value="store.fdbh">{{ store.fdmc }}</option>
              </select>
            </label>
          </div>
          <a-button
            type="submit"
            @click="queryData"
            style="
              margin-top: 20px;
              margin-left: 20px;
              border: 1px solid #ccc;
              border-radius: 5px;
            "
            >查询</a-button
          >
          <div v-if="queryResult && queryResult.length">
            <a-button
              type="primary"
              @click="exportData"
              style="
                margin-top: 20px;
                margin-left: 20px;
                border: 1px solid #ccc;
                border-radius: 5px;
              "
              >导出数据</a-button
            >
          </div>
          <div style="margin-top: 20px" v-if="queryResult && queryResult.length">
            门店预算合计：{{ sumAmount ?? 0 }} 元
          </div>
        </form>
      </div>
      <div v-if="queryResult && queryResult.length" class="query-result">
        <h3>查询结果:</h3>
        <div style="height: 750px; overflow: auto">
          <Table :dataSource="queryResult" :columns="tableHeaders" :pagination="false" />
        </div>
        <a-pagination
          :current="pageNumber"
          :total="totalResults"
          :page-size="pageSize"
          @change="handlePageChange"
          @showSizeChange="handlePageSizeChange"
          show-size-changer
          :show-total="showTotal"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { Table, Pagination } from 'ant-design-vue'

export default {
  components: { Table, Pagination },
  data() {
    return {
      selectedBudgetType: '',
      selectedFile: null,
      message: '',
      pageTitle: '销售计划上传',
      queryBudgetType: '',
      queryNy: '',
      queryFdbh: '',
      pageNumber: 1,
      pageSize: 10,
      queryResult: [],
      totalResults: 0,
      sumAmount: 0,
      storeNames: [],
      tableHeaders: [
        { title: '序号', dataIndex: 'index', key: 'index' }
        // 动态添加的列
      ]
    }
  },
  mounted() {
    this.fetchStoreNames()
  },
  methods: {
    handleFileChange(event) {
      this.selectedFile = event.target.files[0]
    },
    async submitForm() {
      if (!this.selectedBudgetType || !this.selectedFile) {
        this.message = '请选择预算类型并选择文件'
        return
      }

      const formData = new FormData()
      formData.append('budgetFile', this.selectedFile)
      formData.append('budgetType', this.selectedBudgetType)
      document.title = this.pageTitle
      try {
        const response = await axios.post('/upload/uploadFile', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.status === 200) {
          this.message = '上传成功'
        } else {
          this.message = '上传失败'
        }
      } catch (error) {
        this.message = `请求出错: ${error.message}`
      }
    },
    async exportData() {
      if (!this.queryBudgetType || !this.queryNy || !this.queryFdbh) {
        this.message = '请填写查询类型、年月和门店名称'
        return
      }

      try {
        const response = await axios.get('/export/exportBudGetExcel', {
          params: {
            budgetType: this.queryBudgetType,
            ny: this.queryNy,
            fdbh: this.queryFdbh
          },
          responseType: 'blob' // 确保响应类型为 blob
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // 获取文件名
        const contentDisposition = response.headers['content-disposition']
        let fileName = 'exported_data.xlsx' // 默认文件名
        if (contentDisposition) {
          const matches = /filename=([^;]+)/gi.exec(contentDisposition)
          if (matches != null && matches[1]) {
            fileName = decodeURIComponent(matches[1].trim())
          }
        }

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        link.remove()
      } catch (error) {
        this.message = `导出出错: ${error.message}`
      }
    },
    async queryData() {
      if (!this.queryBudgetType || !this.queryNy || !this.queryFdbh) {
        this.message = '请填写查询类型、年月和门店名称'
        return
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
        })

        if (response.status === 200 && response.data.data && response.data.data.records.length) {
          const keys = Object.keys(response.data.data.records[0])
          this.tableHeaders = [
            { title: '序号', dataIndex: 'index', key: 'index' },
            ...keys.map((item) => ({ title: item, dataIndex: item, key: item }))
          ]
          this.queryResult = response.data.data.records.map((item, index) => ({
            index: (this.pageNumber - 1) * this.pageSize + index + 1,
            ...item
          }))
          this.totalResults = response.data.data.total

          // 获取汇总金额
          const sumResponse = await axios.get('/upload/getSumAmount', {
            params: {
              budgetType: this.queryBudgetType,
              ny: this.queryNy,
              fdbh: this.queryFdbh
            }
          })
          this.sumAmount = sumResponse.data.sumAmount || 0
        } else {
          this.queryResult = []
          this.message = '没有查询到数据'
        }
      } catch (error) {
        this.queryResult = []
        this.message = `请求出错: ${error.message}`
      }
    },
    async fetchStoreNames() {
  try {
    const response = await axios.get('/upload/getStoreName')
    if (response.status === 200 && response.data && response.data.data.length) {
      this.storeNames = response.data.data.map(store => ({
        fdbh: store.fdbh,
        fdmc: store.fdmc
      }))
    }
  } catch (error) {
    this.message = `获取门店名称出错: ${error.message}`
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
        })

        if (response.status === 200) {
          this.queryResult.splice(rowIndex, 1)
        } else {
          this.message = '删除失败'
        }
      } catch (error) {
        this.message = `删除出错: ${error.message}`
      }
    },
    handlePageChange(page) {
      this.pageNumber = page
      this.queryData()
    },
    handlePageSizeChange(current, size) {
      this.pageSize = size
      this.queryData()
    },
    showTotal(total) {
      return `总共 ${total} 条`
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
  max-width: 100%;
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
  padding: 10px;
}

.upload-form,
query-form {
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

input[type='file'],
select,
input[type='text'] {
  padding: 10px;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

input[type='number'] {
  padding: 10px;
  height: 40px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

input[type='submit'] {
  padding: 10px;
  /* 增加上间距 */
  margin-top: 20px;
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
  box-sizing: border-box;
  margin-left: 10px;
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

.ant-table {
  background: none;
}
</style>
