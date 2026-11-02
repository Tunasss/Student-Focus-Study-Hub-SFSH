/**
 * Fallback AI Syllabus Extractor Simulator
 * Simulates Gemini AI document structure parsing for uploaded syllabus files (.pdf, .docx, .pptx, .txt).
 * Provides domain-specific curriculum chapters based on course keywords, ensuring immediate
 * 100% interactive testing without blocking on Giang's backend Gemini endpoint.
 */

export function simulateSyllabusExtraction(courseName = '', fileName = '') {
  const normalized = (courseName + ' ' + fileName).toLowerCase();

  if (normalized.includes('db') || normalized.includes('database') || normalized.includes('csdl') || normalized.includes('dữ liệu')) {
    return [
      {
        title: 'Chương 1: Kiến trúc Hệ thống CSDL & Mô hình dữ liệu',
        description: 'Mô hình dữ liệu quan hệ, kiến trúc 3 mức ANSI-SPARC, tính độc lập dữ liệu và ngôn ngữ định nghĩa dữ liệu (DDL).',
        sortOrder: 1,
        status: 'TODO',
      },
      {
        title: 'Chương 2: Thiết kế Mô hình ER & Chuẩn hóa dữ liệu',
        description: 'Thực thể - Mối kết hợp (ERD), phụ thuộc hàm, chuẩn hóa 1NF, 2NF, 3NF và BCNF loại bỏ dư thừa dữ liệu.',
        sortOrder: 2,
        status: 'TODO',
      },
      {
        title: 'Chương 3: Ngôn ngữ SQL & Thủ tục lưu trữ Stored Procedures',
        description: 'Truy vấn nâng cao JOIN, Subquery, Window Functions, Transaction blocks, Triggers và Cursor trong RDBMS.',
        sortOrder: 3,
        status: 'TODO',
      },
      {
        title: 'Chương 4: Quản lý Giao dịch & Kiểm soát tương tranh ACID',
        description: 'Các thuộc tính ACID, lập lịch khả tuần tự (Serializability), khóa 2 pha (2PL) và giải quyết Deadlock.',
        sortOrder: 4,
        status: 'TODO',
      },
      {
        title: 'Chương 5: Chỉ mục Indexing, Tối ưu hóa truy vấn & NoSQL',
        description: 'Cấu trúc B+ Tree, Hash Index, tối ưu bộ giải trình truy vấn và tổng quan các hệ CSDL phân tán NoSQL.',
        sortOrder: 5,
        status: 'TODO',
      },
    ];
  }

  if (normalized.includes('web') || normalized.includes('frontend') || normalized.includes('fullstack') || normalized.includes('internet')) {
    return [
      {
        title: 'Chương 1: Kiến trúc Web Client-Server & Giao thức HTTP/HTTPS',
        description: 'Tổng quan vòng đời Request-Response, RESTful API standards, HTTP headers, cookies và CORS.',
        sortOrder: 1,
        status: 'TODO',
      },
      {
        title: 'Chương 2: Xây dựng Giao diện người dùng với React & Tailwind CSS',
        description: 'Component architecture, Virtual DOM, Hooks (useState, useEffect, useMemo), và Responsive Design.',
        sortOrder: 2,
        status: 'TODO',
      },
      {
        title: 'Chương 3: Xây dựng Backend RESTful API với Node.js & Express',
        description: 'Routing, Middleware pipeline, Prisma ORM kết nối cơ sở dữ liệu và xử lý ngoại lệ tập trung.',
        sortOrder: 3,
        status: 'TODO',
      },
      {
        title: 'Chương 4: Cơ chế Xác thực Authentication JWT & Bảo mật Web',
        description: 'Mã hóa bcrypt, Access/Refresh Token, phân quyền vai trò RBAC và phòng chống tấn công OWASP Top 10.',
        sortOrder: 4,
        status: 'TODO',
      },
      {
        title: 'Chương 5: Tối ưu hiệu năng, Tích hợp CI/CD & Triển khai Cloud',
        description: 'Bundle optimization, Lazy loading, GitHub Actions automated test và Docker containerization.',
        sortOrder: 5,
        status: 'TODO',
      },
    ];
  }

  if (normalized.includes('erp') || normalized.includes('enterprise') || normalized.includes('doanh nghiệp') || normalized.includes('quản trị')) {
    return [
      {
        title: 'Chương 1: Tổng quan Hệ thống Hoạch định Nguồn lực Doanh nghiệp (ERP)',
        description: 'Lịch sử phát triển MRP đến ERP, kiến trúc tích hợp dữ liệu tập trung và lợi ích chuyển đổi số.',
        sortOrder: 1,
        status: 'TODO',
      },
      {
        title: 'Chương 2: Phân hệ Bán hàng CRM & Quản lý Mua hàng (Procurement)',
        description: 'Quy trình Lead-to-Cash, báo giá, đơn hàng, hóa đơn và quy trình mua sắm nguyên vật liệu.',
        sortOrder: 2,
        status: 'TODO',
      },
      {
        title: 'Chương 3: Quản trị Chuỗi cung ứng SCM & Quản trị Tồn kho Kho bãi',
        description: 'Chiến lược nhập xuất FIFO/LIFO, kiểm soát mức tồn kho an toàn và điều chuyển nội bộ đa chi nhánh.',
        sortOrder: 3,
        status: 'TODO',
      },
      {
        title: 'Chương 4: Phân hệ Kế toán Tài chính & Báo cáo Quản trị Doanh nghiệp',
        description: 'Sổ cái chung General Ledger, theo dõi công nợ phải thu/phải trả và báo cáo kết quả hoạt động kinh doanh.',
        sortOrder: 4,
        status: 'TODO',
      },
      {
        title: 'Chương 5: Quy trình Triển khai Odoo/SAP & Đánh giá Rủi ro Dự án',
        description: 'Phương pháp luận triển khai Waterfall vs Agile, đào tạo người dùng cuối và quản lý thay đổi tổ chức.',
        sortOrder: 5,
        status: 'TODO',
      },
    ];
  }

  if (normalized.includes('ai') || normalized.includes('machine learning') || normalized.includes('học máy') || normalized.includes('trí tuệ')) {
    return [
      {
        title: 'Chương 1: Tổng quan Học máy & Tiền xử lý dữ liệu',
        description: 'Khái niệm Supervised/Unsupervised Learning, chuẩn hóa dữ liệu, Feature Engineering và xử lý Missing Values.',
        sortOrder: 1,
        status: 'TODO',
      },
      {
        title: 'Chương 2: Các thuật toán Học có giám sát (Supervised Learning)',
        description: 'Linear Regression, Logistic Regression, Decision Trees, Random Forest và Support Vector Machines (SVM).',
        sortOrder: 2,
        status: 'TODO',
      },
      {
        title: 'Chương 3: Học không giám sát & Kỹ thuật Giảm chiều dữ liệu',
        description: 'Phân cụm K-Means, Hierarchical Clustering và kỹ thuật Principal Component Analysis (PCA).',
        sortOrder: 3,
        status: 'TODO',
      },
      {
        title: 'Chương 4: Mạng nơ-ron nhân tạo & Nhập môn Deep Learning',
        description: 'Perceptron đa lớp (MLP), hàm kích hoạt Activation Functions, lan truyền ngược Backpropagation và Gradient Descent.',
        sortOrder: 4,
        status: 'TODO',
      },
      {
        title: 'Chương 5: Đánh giá mô hình & Tinh chỉnh siêu tham số',
        description: 'Confusion Matrix, Precision/Recall, ROC-AUC, K-fold Cross Validation và phòng tránh hiện tượng Overfitting.',
        sortOrder: 5,
        status: 'TODO',
      },
    ];
  }

  // General fallback for all academic courses
  return [
    {
      title: 'Chương 1: Tổng quan & Cơ sở lý luận nền tảng',
      description: 'Giới thiệu phạm vi môn học, các nguyên lý cơ bản, thuật ngữ chuyên ngành và vai trò trong hệ thống kiến thức.',
      sortOrder: 1,
      status: 'TODO',
    },
    {
      title: 'Chương 2: Phương pháp luận & Khung phân tích cốt lõi',
      description: 'Quy trình nghiên cứu, các công cụ phân tích tiêu chuẩn và kỹ thuật mô hình hóa vấn đề.',
      sortOrder: 2,
      status: 'TODO',
    },
    {
      title: 'Chương 3: Ứng dụng thực hành & Kỹ thuật chuyên sâu',
      description: 'Áp dụng các mô hình vào tình huống cụ thể, xử lý ngoại lệ và các tiêu chuẩn tối ưu hóa giải pháp.',
      sortOrder: 3,
      status: 'TODO',
    },
    {
      title: 'Chương 4: Đánh giá hiệu quả, Rủi ro & Tối ưu giải pháp',
      description: 'Phương pháp đo lường kết quả, tiêu chí nghiệm thu và quản lý các rủi ro kỹ thuật trong triển khai.',
      sortOrder: 4,
      status: 'TODO',
    },
    {
      title: 'Chương 5: Nghiên cứu trường hợp & Đồ án tổng hợp môn học',
      description: 'Tổng kết kiến thức toàn diện qua dự án thực tế, trình bày kết quả và hướng mở rộng nghiên cứu tiếp theo.',
      sortOrder: 5,
      status: 'TODO',
    },
  ];
}

