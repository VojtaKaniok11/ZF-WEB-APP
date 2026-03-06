-- 1. Vytvoření tabulky pro kategorie školení
CREATE TABLE dbo.TRAINING_CATEGORIES (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME()
);

-- 2. Vytvoření tabulky pro katalog školení
CREATE TABLE dbo.TRAININGS_CATALOG (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryID INT NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    PeriodicityMonths INT NOT NULL, -- Počet měsíců platnosti (12, 24, 36...)
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TrainingsCatalog_Category FOREIGN KEY (CategoryID) REFERENCES dbo.TRAINING_CATEGORIES(ID)
);

-- 3. Vytvoření tabulky pro záznamy o absolvovaných školeních
CREATE TABLE dbo.TRAINING_RECORDS (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,  -- Navázáno na stávající dbo.EMPLOYEES
    TrainingID INT NOT NULL,  -- Navázáno na dbo.TRAININGS_CATALOG
    CompletionDate DATE NOT NULL,
    ExpirationDate DATE NOT NULL, -- Bude vypočteno backendem a zde uloženo
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TrainingRecords_Employee FOREIGN KEY (EmployeeID) REFERENCES dbo.EMPLOYEES(ID),
    CONSTRAINT FK_TrainingRecords_Training FOREIGN KEY (TrainingID) REFERENCES dbo.TRAININGS_CATALOG(ID)
);

-- Vytvoření indexů pro rychlé dotazování
CREATE NONCLUSTERED INDEX IX_TrainingRecords_EmployeeID ON dbo.TRAINING_RECORDS(EmployeeID);
CREATE NONCLUSTERED INDEX IX_TrainingRecords_TrainingID ON dbo.TRAINING_RECORDS(TrainingID);
