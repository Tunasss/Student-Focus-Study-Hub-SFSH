/**
 * Fallback AI Syllabus Extractor Simulator
 * Simulates Gemini AI document structure parsing for uploaded syllabus files (.pdf, .docx, .pptx, .txt).
 * Provides domain-specific curriculum chapters based on course keywords or uploaded chapter slides, ensuring immediate
 * 100% interactive testing without blocking on Gemini endpoint.
 */

export function simulateSyllabusExtraction(courseName = '', fileNameOrFiles = '') {
  // If multiple chapter files are uploaded, map each file to a dedicated chapter
  if (Array.isArray(fileNameOrFiles) && fileNameOrFiles.length > 1) {
    return fileNameOrFiles.map((file, idx) => {
      const original = file?.name || file || `Chapter ${idx + 1}`;
      const cleanName = String(original)
        .replace(/\.pdf$/i, '')
        .replace(/[-_]/g, ' ')
        .trim();
      const hasPrefix = /^(chương|chapter|bài|ch)\b/i.test(cleanName);
      const chNum = idx + 1;
      return {
        title: hasPrefix ? cleanName : `Chương ${chNum}: ${cleanName}`,
        description: `Nội dung và mục tiêu học tập từ tài liệu ${original}.`,
        sourceFile: String(original),
        sortOrder: chNum,
        status: 'TODO',
        subtopics: [
          {
            title: `${chNum}.1 Tổng quan & Cơ sở lý luận nền tảng`,
            description: 'Giới thiệu các nguyên lý cơ bản, thuật ngữ và định hướng tiếp cận',
            sortOrder: 1,
            status: 'TODO',
          },
          {
            title: `${chNum}.2 Phương pháp luận & Phân tích chuyên sâu`,
            description: 'Khung phân tích tiêu chuẩn, mô hình hóa và các kỹ thuật xử lý cốt lõi',
            sortOrder: 2,
            status: 'TODO',
          },
          {
            title: `${chNum}.3 Ứng dụng thực hành & Tối ưu giải pháp`,
            description: 'Bài tập áp dụng, tình huống thực tế và đánh giá hiệu quả triển khai',
            sortOrder: 3,
            status: 'TODO',
          },
        ],
      };
    });
  }

  const fileName = Array.isArray(fileNameOrFiles) ? (fileNameOrFiles[0]?.name || '') : String(fileNameOrFiles || '');
  const normalized = (courseName + ' ' + fileName).toLowerCase();

  if (normalized.includes('db') || normalized.includes('database') || normalized.includes('csdl') || normalized.includes('dữ liệu')) {
    return [
      {
        title: 'Chương 1: Kiến trúc Hệ thống CSDL & Mô hình dữ liệu',
        description: 'Mô hình dữ liệu quan hệ, kiến trúc 3 mức ANSI-SPARC, tính độc lập dữ liệu và ngôn ngữ định nghĩa dữ liệu (DDL).',
        sortOrder: 1,
        status: 'TODO',
        subtopics: [
          { title: '1.1 Tổng quan kiến trúc & ANSI-SPARC', description: 'Mô hình dữ liệu quan hệ và tính độc lập dữ liệu', sortOrder: 1, status: 'TODO' },
          { title: '1.2 Ngôn ngữ định nghĩa dữ liệu (DDL)', description: 'Tạo bảng, ràng buộc toàn vẹn và sơ đồ CSDL', sortOrder: 2, status: 'TODO' },
          { title: '1.3 Phân loại các hệ quản trị CSDL', description: 'RDBMS vs OODBMS và các tiêu chuẩn công nghiệp', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 2: Thiết kế Mô hình ER & Chuẩn hóa dữ liệu',
        description: 'Thực thể - Mối kết hợp (ERD), phụ thuộc hàm, chuẩn hóa 1NF, 2NF, 3NF và BCNF loại bỏ dư thừa dữ liệu.',
        sortOrder: 2,
        status: 'TODO',
        subtopics: [
          { title: '2.1 Mô hình thực thể kết hợp (ERD)', description: 'Thực thể, thuộc tính và các loại mối kết hợp', sortOrder: 1, status: 'TODO' },
          { title: '2.2 Phụ thuộc hàm & Khóa chính', description: 'Bao đóng tập thuộc tính và xác định khóa tối thiểu', sortOrder: 2, status: 'TODO' },
          { title: '2.3 Chuẩn hóa 1NF, 2NF, 3NF & BCNF', description: 'Quy tắc chuẩn hóa nhằm triệt tiêu dị thường dữ liệu', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 3: Ngôn ngữ SQL & Thủ tục lưu trữ Stored Procedures',
        description: 'Truy vấn nâng cao JOIN, Subquery, Window Functions, Transaction blocks, Triggers và Cursor trong RDBMS.',
        sortOrder: 3,
        status: 'TODO',
        subtopics: [
          { title: '3.1 Ngôn ngữ thao tác dữ liệu (DML)', description: 'Truy vấn SELECT nâng cao với JOIN và Subquery', sortOrder: 1, status: 'TODO' },
          { title: '3.2 Gom nhóm GROUP BY & Window Functions', description: 'Phân tích dữ liệu theo phân vùng và hàm tổng hợp', sortOrder: 2, status: 'TODO' },
          { title: '3.3 Stored Procedures & Triggers', description: 'Thủ tục lưu trữ, hàm người dùng và bẫy sự kiện', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 4: Quản lý Giao dịch & Kiểm soát tương tranh ACID',
        description: 'Các thuộc tính ACID, lập lịch khả tuần tự (Serializability), khóa 2 pha (2PL) và giải quyết Deadlock.',
        sortOrder: 4,
        status: 'TODO',
        subtopics: [
          { title: '4.1 Khái niệm Giao dịch & Thuộc tính ACID', description: 'Tính nguyên tử, nhất quán, cô lập và bền vững', sortOrder: 1, status: 'TODO' },
          { title: '4.2 Kiểm soát tương tranh & Khóa 2 pha', description: 'Shared Lock, Exclusive Lock và giao thức 2PL', sortOrder: 2, status: 'TODO' },
          { title: '4.3 Phát hiện & Khắc phục Deadlock', description: 'Đồ thị chờ đợi và chiến lược giải tỏa bế tắc', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 5: Chỉ mục Indexing, Tối ưu hóa truy vấn & NoSQL',
        description: 'Cấu trúc B+ Tree, Hash Index, tối ưu bộ giải trình truy vấn và tổng quan các hệ CSDL phân tán NoSQL.',
        sortOrder: 5,
        status: 'TODO',
        subtopics: [
          { title: '5.1 Cấu trúc chỉ mục B+ Tree & Hash Index', description: 'Cơ chế tăng tốc truy xuất bản ghi trên đĩa cứng', sortOrder: 1, status: 'TODO' },
          { title: '5.2 Tối ưu hóa truy vấn Query Optimization', description: 'Phân tích Execution Plan và tối ưu cú pháp SQL', sortOrder: 2, status: 'TODO' },
          { title: '5.3 Tổng quan các hệ CSDL NoSQL', description: 'Document, Key-Value và Column-family stores', sortOrder: 3, status: 'TODO' },
        ],
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
        subtopics: [
          { title: '1.1 Mô hình Client-Server & Vòng đời HTTP', description: 'Request headers, Response status codes và TLS/SSL', sortOrder: 1, status: 'TODO' },
          { title: '1.2 Chuẩn thiết kế RESTful API', description: 'HTTP verbs, URI convention và JSON payload standard', sortOrder: 2, status: 'TODO' },
          { title: '1.3 Cơ chế Cross-Origin Resource Sharing (CORS)', description: 'Preflight OPTIONS request và bảo mật Cookie/Session', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 2: Xây dựng Giao diện người dùng với React & Tailwind CSS',
        description: 'Component architecture, Virtual DOM, Hooks (useState, useEffect, useMemo), và Responsive Design.',
        sortOrder: 2,
        status: 'TODO',
        subtopics: [
          { title: '2.1 Kiến trúc Component & JSX Syntax', description: 'Virtual DOM, Props vs State và Render lifecycle', sortOrder: 1, status: 'TODO' },
          { title: '2.2 React Hooks cơ bản & nâng cao', description: 'useState, useEffect, useRef, useMemo và useCallback', sortOrder: 2, status: 'TODO' },
          { title: '2.3 Thiết kế Responsive với Tailwind CSS', description: 'Mobile-first breakpoint và Utility-first CSS', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 3: Xây dựng Backend RESTful API với Node.js & Express',
        description: 'Routing, Middleware pipeline, Prisma ORM kết nối cơ sở dữ liệu và xử lý ngoại lệ tập trung.',
        sortOrder: 3,
        status: 'TODO',
        subtopics: [
          { title: '3.1 Kiến trúc Module & Routing trong Express', description: 'Express Router và cấu trúc mã nguồn theo lớp', sortOrder: 1, status: 'TODO' },
          { title: '3.2 Middleware Pipeline & Validation', description: 'Global error handler, Request parsing và Zod schema', sortOrder: 2, status: 'TODO' },
          { title: '3.3 Tích hợp Cơ sở dữ liệu với Prisma ORM', description: 'Prisma schema, migration và CRUD transactions', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 4: Cơ chế Xác thực Authentication JWT & Bảo mật Web',
        description: 'Mã hóa bcrypt, Access/Refresh Token, phân quyền vai trò RBAC và phòng chống tấn công OWASP Top 10.',
        sortOrder: 4,
        status: 'TODO',
        subtopics: [
          { title: '4.1 Băm mật khẩu bcrypt & Cơ chế JWT Token', description: 'Access Token, Refresh Token và xác thực Bearer', sortOrder: 1, status: 'TODO' },
          { title: '4.2 Phân quyền người dùng RBAC', description: 'Role-based access control middleware', sortOrder: 2, status: 'TODO' },
          { title: '4.3 Phòng chống lỗ hổng OWASP Top 10', description: 'SQL Injection, XSS, CSRF và Rate Limiting', sortOrder: 3, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 5: Tối ưu hiệu năng, Tích hợp CI/CD & Triển khai Cloud',
        description: 'Bundle optimization, Lazy loading, GitHub Actions automated test và Docker containerization.',
        sortOrder: 5,
        status: 'TODO',
        subtopics: [
          { title: '5.1 Tối ưu hiệu năng Frontend', description: 'Code splitting, dynamic import và caching', sortOrder: 1, status: 'TODO' },
          { title: '5.2 Tự động hóa kiểm thử với CI/CD', description: 'GitHub Actions workflow và automated test runner', sortOrder: 2, status: 'TODO' },
          { title: '5.3 Đóng gói Docker & Triển khai Cloud', description: 'Dockerfile, Container networking và deployment', sortOrder: 3, status: 'TODO' },
        ],
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
        subtopics: [
          { title: '1.1 Quá trình phát triển từ MRP đến ERP', description: 'Sự cần thiết của giải pháp ERP trong quản trị doanh nghiệp', sortOrder: 1, status: 'TODO' },
          { title: '1.2 Kiến trúc cơ sở dữ liệu tích hợp tập trung', description: 'Tính nhất quán dữ liệu liên phòng ban', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 2: Phân hệ Bán hàng CRM & Quản lý Mua hàng (Procurement)',
        description: 'Quy trình Lead-to-Cash, báo giá, đơn hàng, hóa đơn và quy trình mua sắm nguyên vật liệu.',
        sortOrder: 2,
        status: 'TODO',
        subtopics: [
          { title: '2.1 Quy trình Bán hàng Lead-to-Cash', description: 'Cơ hội bán hàng, báo giá, Sales Order và đối soát công nợ', sortOrder: 1, status: 'TODO' },
          { title: '2.2 Quy trình Mua sắm & Đánh giá Nhà cung cấp', description: 'Yêu cầu mua sắm RFQ, Purchase Order và tiếp nhận hàng', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 3: Quản trị Chuỗi cung ứng SCM & Quản trị Tồn kho Kho bãi',
        description: 'Chiến lược nhập xuất FIFO/LIFO, kiểm soát mức tồn kho an toàn và điều chuyển nội bộ đa chi nhánh.',
        sortOrder: 3,
        status: 'TODO',
        subtopics: [
          { title: '3.1 Chiến lược định giá & Quản lý vị trí kho', description: 'Định giá tồn kho FIFO, LIFO, bình quân gia quyền và mã vị trí', sortOrder: 1, status: 'TODO' },
          { title: '3.2 Hoạch định tồn kho an toàn & Điểm đặt hàng', description: 'Safety stock, Reorder point và giảm thiểu chi phí lưu kho', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 4: Phân hệ Kế toán Tài chính & Báo cáo Quản trị Doanh nghiệp',
        description: 'Sổ cái chung General Ledger, theo dõi công nợ phải thu/phải trả và báo cáo kết quả hoạt động kinh doanh.',
        sortOrder: 4,
        status: 'TODO',
        subtopics: [
          { title: '4.1 Sổ cái chung (GL) & Hạch toán tự động', description: 'Bút toán sinh tự động từ phân hệ Bán hàng và Mua sắm', sortOrder: 1, status: 'TODO' },
          { title: '4.2 Báo cáo tài chính & Chỉ số hiệu quả kinh doanh', description: 'Bảng cân đối kế toán, P&L và báo cáo dòng tiền', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 5: Quy trình Triển khai Odoo/SAP & Đánh giá Rủi ro Dự án',
        description: 'Phương pháp luận triển khai Waterfall vs Agile, đào tạo người dùng cuối và quản lý thay đổi tổ chức.',
        sortOrder: 5,
        status: 'TODO',
        subtopics: [
          { title: '5.1 Các giai đoạn trong dự án triển khai ERP', description: 'Khảo sát quy trình, Gap analysis, cấu hình và nghiệm thu', sortOrder: 1, status: 'TODO' },
          { title: '5.2 Quản trị thay đổi & Giảm thiểu rủi ro thất bại', description: 'Chiến lược đào tạo người dùng và chuyển đổi dữ liệu', sortOrder: 2, status: 'TODO' },
        ],
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
        subtopics: [
          { title: '1.1 Phân loại bài toán Học máy', description: 'Học có giám sát, không giám sát và học tăng cường', sortOrder: 1, status: 'TODO' },
          { title: '1.2 Tiền xử lý dữ liệu & Chuẩn hóa', description: 'Xử lý giá trị khuyết, One-hot encoding và MinMax scaler', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 2: Các thuật toán Học có giám sát (Supervised Learning)',
        description: 'Linear Regression, Logistic Regression, Decision Trees, Random Forest và Support Vector Machines (SVM).',
        sortOrder: 2,
        status: 'TODO',
        subtopics: [
          { title: '2.1 Hồi quy tuyến tính & Logistic', description: 'Cost function, Gradient Descent và phân lớp nhị phân', sortOrder: 1, status: 'TODO' },
          { title: '2.2 Cây quyết định & Rừng ngẫu nhiên', description: 'Entropy, Information Gain, Gini index và Ensemble learning', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 3: Học không giám sát & Kỹ thuật Giảm chiều dữ liệu',
        description: 'Phân cụm K-Means, Hierarchical Clustering và kỹ thuật Principal Component Analysis (PCA).',
        sortOrder: 3,
        status: 'TODO',
        subtopics: [
          { title: '3.1 Thuật toán phân cụm K-Means & Hierarchical', description: 'Xác định tâm cụm và phương pháp Elbow method', sortOrder: 1, status: 'TODO' },
          { title: '3.2 Giảm chiều dữ liệu với PCA', description: 'Eigenvalues, Eigenvectors và bảo toàn phương sai', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 4: Mạng nơ-ron nhân tạo & Nhập môn Deep Learning',
        description: 'Perceptron đa lớp (MLP), hàm kích hoạt Activation Functions, lan truyền ngược Backpropagation và Gradient Descent.',
        sortOrder: 4,
        status: 'TODO',
        subtopics: [
          { title: '4.1 Cấu trúc Perceptron & Hàm kích hoạt', description: 'Sigmoid, ReLU, Softmax và cấu trúc tầng ẩn', sortOrder: 1, status: 'TODO' },
          { title: '4.2 Thuật toán Lan truyền ngược Backpropagation', description: 'Đạo hàm chuỗi (Chain rule) và cập nhật trọng số mạng', sortOrder: 2, status: 'TODO' },
        ],
      },
      {
        title: 'Chương 5: Đánh giá mô hình & Tinh chỉnh siêu tham số',
        description: 'Confusion Matrix, Precision/Recall, ROC-AUC, K-fold Cross Validation và phòng tránh hiện tượng Overfitting.',
        sortOrder: 5,
        status: 'TODO',
        subtopics: [
          { title: '5.1 Các chỉ số đánh giá phân lớp & hồi quy', description: 'Confusion Matrix, Precision, Recall, F1-Score và MSE', sortOrder: 1, status: 'TODO' },
          { title: '5.2 Cross Validation & Tinh chỉnh siêu tham số', description: 'K-fold CV, Grid Search và Random Search', sortOrder: 2, status: 'TODO' },
        ],
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
      subtopics: [
        { title: '1.1 Khái niệm cơ bản & Thuật ngữ', description: 'Các nguyên lý căn bản và bối cảnh môn học', sortOrder: 1, status: 'TODO' },
        { title: '1.2 Kiến trúc & Mô hình tổng thể', description: 'Cấu trúc hệ thống và luồng tương tác cốt lõi', sortOrder: 2, status: 'TODO' },
      ],
    },
    {
      title: 'Chương 2: Phương pháp luận & Khung phân tích cốt lõi',
      description: 'Quy trình nghiên cứu, các công cụ phân tích tiêu chuẩn và kỹ thuật mô hình hóa vấn đề.',
      sortOrder: 2,
      status: 'TODO',
      subtopics: [
        { title: '2.1 Khung phân tích tiêu chuẩn', description: 'Các tiêu chí và công cụ đánh giá chính', sortOrder: 1, status: 'TODO' },
        { title: '2.2 Kỹ thuật mô hình hóa giải pháp', description: 'Phương pháp phân rã và thiết kế mô hình', sortOrder: 2, status: 'TODO' },
      ],
    },
    {
      title: 'Chương 3: Ứng dụng thực hành & Kỹ thuật chuyên sâu',
      description: 'Áp dụng các mô hình vào tình huống cụ thể, xử lý ngoại lệ và các tiêu chuẩn tối ưu hóa giải pháp.',
      sortOrder: 3,
      status: 'TODO',
      subtopics: [
        { title: '3.1 Kỹ thuật thực hành ứng dụng', description: 'Các bước triển khai chi tiết và xử lý tình huống', sortOrder: 1, status: 'TODO' },
        { title: '3.2 Xử lý ngoại lệ & Tiêu chuẩn kỹ thuật', description: 'Phòng ngừa lỗi và tối ưu hiệu suất', sortOrder: 2, status: 'TODO' },
      ],
    },
    {
      title: 'Chương 4: Đánh giá hiệu quả, Rủi ro & Tối ưu giải pháp',
      description: 'Phương pháp đo lường kết quả, tiêu chí nghiệm thu và quản lý các rủi ro kỹ thuật trong triển khai.',
      sortOrder: 4,
      status: 'TODO',
      subtopics: [
        { title: '4.1 Phương pháp đo lường hiệu quả', description: 'Chỉ số KPI và tiêu chí nghiệm thu', sortOrder: 1, status: 'TODO' },
        { title: '4.2 Quản trị rủi ro & Tối ưu hóa', description: 'Đánh giá rủi ro và các biện pháp khắc phục', sortOrder: 2, status: 'TODO' },
      ],
    },
    {
      title: 'Chương 5: Nghiên cứu trường hợp & Đồ án tổng hợp môn học',
      description: 'Tổng kết kiến thức toàn diện qua dự án thực tế, trình bày kết quả và hướng mở rộng nghiên cứu tiếp theo.',
      sortOrder: 5,
      status: 'TODO',
      subtopics: [
        { title: '5.1 Bài tập lớn & Nghiên cứu trường hợp thực tế', description: 'Áp dụng toàn bộ kiến thức vào dự án cụ thể', sortOrder: 1, status: 'TODO' },
        { title: '5.2 Tổng kết & Định hướng mở rộng', description: 'Đánh giá kết quả và các chủ đề nghiên cứu nâng cao', sortOrder: 2, status: 'TODO' },
      ],
    },
  ];
}
