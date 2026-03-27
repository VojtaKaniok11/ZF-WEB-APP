USE [master]
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'HR')
BEGIN
    CREATE DATABASE [HR];
END
GO

USE [HR]
GO

-- =============================================
-- 1. ZAMĚSTNANCI (dbo.EMPLOYEES)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EMPLOYEES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EMPLOYEES](
        [ID] [int] IDENTITY(1,1) PRIMARY KEY,
        [PersonalNumber] [nvarchar](50) NOT NULL,
        [FirstName] [nvarchar](100) NULL,
        [LastName] [nvarchar](100) NULL,
        [Department] [nvarchar](100) NULL,
        [CostCenter] [nvarchar](50) NULL,
        [Workcenter] [nvarchar](50) NULL,
        [HiringDate] [datetime2] NULL,
        [IsActive] [bit] DEFAULT 1,
        [CreatedAt] [datetime2] DEFAULT SYSDATETIME(),
        [UpdatedAt] [datetime2] DEFAULT SYSDATETIME(),
        [Phone] [nvarchar](50) NULL,
        [Email] [nvarchar](255) NULL,
        [Position] [nvarchar](100) NULL,
        [Level] [nvarchar](50) NULL,
        [ManagerID] [int] NULL,
        [ManagerName] [nvarchar](255) NULL,
        [BIS_Osoba_ID] [int] NULL,
        [Photo] [nvarchar](MAX) NULL,
        [HasWashingProgram] [bit] DEFAULT 0
    );
    CREATE UNIQUE INDEX IX_EMPLOYEES_PersonalNumber ON [dbo].[EMPLOYEES](PersonalNumber);
    CREATE INDEX IX_EMPLOYEES_BisOsobaID ON [dbo].[EMPLOYEES](BIS_Osoba_ID);
END
GO

-- =============================================
-- 2. LÉKAŘSKÉ PROHLÍDKY
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MEDICAL_EXAM_TYPES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MEDICAL_EXAM_TYPES](
        [ID] [nvarchar](50) PRIMARY KEY, -- Např. MED-20240101-ABCD
        [Name] [nvarchar](255) NOT NULL,
        [ValidityMonths] [int] DEFAULT 0,
        [Category] [nvarchar](100) NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[MEDICAL_EXAM_RECORDS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[MEDICAL_EXAM_RECORDS](
        [ID] [nvarchar](50) PRIMARY KEY, -- Např. REC-20240101-ABCD
        [ExamTypeID] [nvarchar](50) NOT NULL,
        [EmployeePersonalNumber] [nvarchar](50) NOT NULL,
        [ExamDate] [datetime2] NOT NULL,
        [NextExamDate] [datetime2] NULL,
        [DoctorName] [nvarchar](255) NULL,
        [Result] [nvarchar](MAX) NULL,
        [Notes] [nvarchar](MAX) NULL,
        CONSTRAINT FK_MedicalExamRecords_Type FOREIGN KEY (ExamTypeID) REFERENCES [dbo].[MEDICAL_EXAM_TYPES](ID)
    );
    CREATE INDEX IX_MedicalExamRecords_PN ON [dbo].[MEDICAL_EXAM_RECORDS](EmployeePersonalNumber);
END
GO

-- =============================================
-- 3. ŠKOLENÍ (Katalog v2)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TRAINING_CATEGORIES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TRAINING_CATEGORIES](
        [ID] [int] IDENTITY(1,1) PRIMARY KEY,
        [Name] [nvarchar](255) NOT NULL,
        [CreatedAt] [datetime2] DEFAULT SYSDATETIME()
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TRAININGS_CATALOG]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TRAININGS_CATALOG](
        [ID] [int] IDENTITY(1,1) PRIMARY KEY,
        [CategoryID] [int] NOT NULL,
        [Name] [nvarchar](255) NOT NULL,
        [Description] [nvarchar](MAX) NULL,
        [PeriodicityMonths] [int] DEFAULT 0,
        [CreatedAt] [datetime2] DEFAULT SYSDATETIME(),
        CONSTRAINT FK_TrainingsCatalog_Category FOREIGN KEY (CategoryID) REFERENCES [dbo].[TRAINING_CATEGORIES](ID)
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[TRAINING_RECORDS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[TRAINING_RECORDS](
        [ID] [int] IDENTITY(1,1) PRIMARY KEY,
        [EmployeeID] [int] NOT NULL,
        [TrainingID] [int] NOT NULL,
        [CompletionDate] [datetime2] NOT NULL,
        [ExpirationDate] [datetime2] NOT NULL,
        [IsLegalOrExternal] [bit] DEFAULT 0,
        [CreatedAt] [datetime2] DEFAULT SYSDATETIME(),
        CONSTRAINT FK_TrainingRecords_Employee FOREIGN KEY (EmployeeID) REFERENCES [dbo].[EMPLOYEES](ID),
        CONSTRAINT FK_TrainingRecords_Training FOREIGN KEY (TrainingID) REFERENCES [dbo].[TRAININGS_CATALOG](ID)
    );
    CREATE INDEX IX_TrainingRecords_EmployeeID ON [dbo].[TRAINING_RECORDS](EmployeeID);
    CREATE INDEX IX_TrainingRecords_TrainingID ON [dbo].[TRAINING_RECORDS](TrainingID);
END
GO

-- =============================================
-- 4. ILUO (Matice dovedností)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ILUO_SKILLS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ILUO_SKILLS](
        [ID] [nvarchar](50) PRIMARY KEY,
        [Name] [nvarchar](255) NOT NULL,
        [Category] [nvarchar](100) NULL,
        [WorkCenterID] [nvarchar](50) NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ILUO_ASSESSMENTS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ILUO_ASSESSMENTS](
        [ID] [int] IDENTITY(1,1) PRIMARY KEY,
        [SkillID] [nvarchar](50) NOT NULL,
        [EmployeePersonalNumber] [nvarchar](50) NOT NULL,
        [Level] [nvarchar](50) NULL,
        [TargetLevel] [nvarchar](50) NULL,
        [AssessmentDate] [datetime2] NOT NULL,
        [NextReviewDate] [datetime2] NULL,
        [AssessorName] [nvarchar](255) NULL,
        [Notes] [nvarchar](MAX) NULL,
        CONSTRAINT FK_Iluo_Skills FOREIGN KEY (SkillID) REFERENCES [dbo].[ILUO_SKILLS](ID)
    );
    CREATE INDEX IX_IluoAssessments_PN ON [dbo].[ILUO_ASSESSMENTS](EmployeePersonalNumber);
END
GO

-- =============================================
-- 5. OOPP (Ochranné pomůcky)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OOPP_ITEMS]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[OOPP_ITEMS](
        [ID] [nvarchar](50) PRIMARY KEY,
        [Name] [nvarchar](255) NOT NULL,
        [Category] [nvarchar](100) NULL
    );
END

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[OOPP_ISSUES]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[OOPP_ISSUES](
        [ID] [nvarchar](50) PRIMARY KEY,
        [OoppItemID] [nvarchar](50) NOT NULL,
        [EmployeePersonalNumber] [nvarchar](50) NOT NULL,
        [IssueDate] [datetime2] NOT NULL,
        [NextEntitlementDate] [datetime2] NULL,
        [Quantity] [int] DEFAULT 1,
        [Size] [nvarchar](50) NULL,
        [Notes] [nvarchar](MAX) NULL,
        CONSTRAINT FK_Oopp_Items FOREIGN KEY (OoppItemID) REFERENCES [dbo].[OOPP_ITEMS](ID)
    );
    CREATE INDEX IX_OoppIssues_PN ON [dbo].[OOPP_ISSUES](EmployeePersonalNumber);
END
GO
