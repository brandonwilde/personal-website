import { BookshelfScene } from './assets/js/BookshelfScene.js';
import { bookConfigs, shelfConfigs, modalConfig } from './assets/js/config/contentConfig.js';

// Initialize modals first
function initializeModals(interactionManager) {
    const modalContainer = document.getElementById('modals');
    
    // Remove existing modals but keep templates
    Array.from(modalContainer.children).forEach(child => {
        console.log('Child element:', child.tagName, child.id);
        if (!child.tagName.toLowerCase().includes('template')) {
            modalContainer.removeChild(child);
        }
    });

    // Create modals for each book
    Object.entries(bookConfigs).forEach(([category, books]) => {
        // Get the template for this category
        let templateId;
        if (category === 'education') {
            templateId = modalConfig.templates.education;
        } else if (category === 'experience') {
            templateId = modalConfig.templates.job;
        } else if (category === 'other' && books.contact) {
            templateId = modalConfig.templates.businessCard;
        } else if (category === 'reviews' || category === 'reading') {
            templateId = modalConfig.templates.bookReviews;
        }

        if (!templateId) return;

        const template = document.getElementById(templateId);
        if (!template) return;

        // Create modals for each book in this category
        Object.entries(books).forEach(([bookId, bookConfig]) => {
            console.log(`Processing book: ${bookId}`);
            // Skip if no modal info
            if (!bookConfig.modalInfo) {
                console.log(`No modal info for book: ${bookId}`);
                return;
            }

            // Create modal container
            const modalElement = document.createElement('div');
            modalElement.id = `${bookId}Modal`;
            modalElement.classList.add('modal-container');
            
            // Create modal content directly instead of using template
            const modalContent = document.createElement('div');
            modalContent.classList.add('modal-content');
            
            // Add close button
            const closeDiv = document.createElement('div');
            closeDiv.classList.add('close-div');
            const closeBtn = document.createElement('span');
            closeBtn.classList.add('close');
            closeBtn.innerHTML = '&times;';
            closeDiv.appendChild(closeBtn);
            modalContent.appendChild(closeDiv);

            // Add content based on category
            if (category === 'education') {
                const modalInfo = bookConfig.modalInfo;
                
                // Add image section
                const imageDiv = document.createElement('div');
                imageDiv.classList.add('modal-image');
                const logo = document.createElement('img');
                logo.classList.add('university-logo');
                if (modalInfo.logoSrc) {
                    logo.src = modalInfo.logoSrc;
                    logo.alt = modalInfo.logoAlt || '';
                }
                imageDiv.appendChild(logo);
                modalContent.appendChild(imageDiv);

                // Add info section
                const infoDiv = document.createElement('div');
                infoDiv.classList.add('modal-info');

                // Add degree
                const degree = document.createElement('h2');
                degree.innerHTML = `<i class="fa fa-graduation-cap"></i> ${modalInfo.degree || ''}`;
                infoDiv.appendChild(degree);

                // Add university
                const university = document.createElement('p');
                university.innerHTML = `<strong><i class="fas fa-university"></i> ${modalInfo.university || ''}</strong>`;
                infoDiv.appendChild(university);

                // Add highlight box
                const highlightBox = document.createElement('div');
                highlightBox.classList.add('highlight-box');
                
                // Add GPA
                const gpaP = document.createElement('p');
                gpaP.innerHTML = `<span class="gpa-label">GPA:</span><span class="gpa-value">${modalInfo.gpa || ''}</span>`;
                highlightBox.appendChild(gpaP);

                // Add graduation date
                const gradDateP = document.createElement('p');
                gradDateP.classList.add('graduation-date');
                gradDateP.innerHTML = `<i class="fas fa-calendar-alt"></i> ${modalInfo.graduationDate || ''}`;
                highlightBox.appendChild(gradDateP);
                
                infoDiv.appendChild(highlightBox);

                // Add projects section
                if (modalInfo.projects && modalInfo.projects.length > 0) {
                    const projectsTitle = document.createElement('h3');
                    projectsTitle.innerHTML = '<i class="fas fa-project-diagram"></i> Research Projects:';
                    infoDiv.appendChild(projectsTitle);

                    const projectsList = document.createElement('ul');
                    projectsList.classList.add('research-projects');
                    modalInfo.projects.forEach(project => {
                        const li = document.createElement('li');
                        li.textContent = project;
                        projectsList.appendChild(li);
                    });
                    infoDiv.appendChild(projectsList);
                }

                modalContent.appendChild(infoDiv);

            } else if (category === 'experience') {
                const modalInfo = bookConfig.modalInfo;
                
                const infoDiv = document.createElement('div');
                infoDiv.classList.add('modal-info');

                // Add position
                const position = document.createElement('h2');
                position.classList.add('job-position');
                position.textContent = modalInfo.position || '';
                infoDiv.appendChild(position);

                // Add company
                const company = document.createElement('p');
                company.classList.add('company');
                company.innerHTML = `<strong><i class="far fa-building"></i> ${modalInfo.company || ''}</strong>`;
                infoDiv.appendChild(company);

                // Add dates
                const dates = document.createElement('p');
                dates.classList.add('job-dates');
                dates.innerHTML = `<i class="fas fa-calendar-alt"></i> ${modalInfo.startDate || ''} - ${modalInfo.endDate || 'Present'}`;
                infoDiv.appendChild(dates);

                // Add accomplishments
                if (modalInfo.accomplishments && modalInfo.accomplishments.length > 0) {
                    const accomplishmentsTitle = document.createElement('h3');
                    accomplishmentsTitle.textContent = 'Accomplishments:';
                    infoDiv.appendChild(accomplishmentsTitle);

                    const accomplishmentsList = document.createElement('ul');
                    accomplishmentsList.classList.add('job-accomplishments');
                    modalInfo.accomplishments.forEach(accomplishment => {
                        const li = document.createElement('li');
                        li.textContent = accomplishment;
                        accomplishmentsList.appendChild(li);
                    });
                    infoDiv.appendChild(accomplishmentsList);
                }

                modalContent.appendChild(infoDiv);

            } else if (category === 'other' && bookId === 'contact') {
                const modalInfo = bookConfig.modalInfo;
                
                const businessCard = document.createElement('div');
                businessCard.classList.add('business-card');

                // Add header
                const header = document.createElement('div');
                header.classList.add('header');

                // Add left section
                const left = document.createElement('div');
                left.classList.add('left');
                
                const name = document.createElement('h1');
                name.id = 'name';
                name.textContent = modalInfo.name || '';
                left.appendChild(name);

                const jobTitle1 = document.createElement('h2');
                jobTitle1.id = 'jobTitle1';
                jobTitle1.classList.add('jobTitle');
                jobTitle1.textContent = modalInfo.jobTitle1 || '';
                left.appendChild(jobTitle1);

                const jobTitle2 = document.createElement('h2');
                jobTitle2.id = 'jobTitle2';
                jobTitle2.classList.add('jobTitle');
                jobTitle2.textContent = modalInfo.jobTitle2 || '';
                left.appendChild(jobTitle2);

                header.appendChild(left);

                // Add right section
                const right = document.createElement('div');
                right.classList.add('right');
                
                if (modalInfo.personalLogoSrc) {
                    const logo = document.createElement('img');
                    logo.id = 'personalLogo';
                    logo.src = modalInfo.personalLogoSrc;
                    logo.alt = modalInfo.personalLogoAlt || '';
                    right.appendChild(logo);
                }

                header.appendChild(right);
                businessCard.appendChild(header);

                // Add footer
                const footer = document.createElement('div');
                footer.classList.add('footer');

                if (modalInfo.emailSrc) {
                    const emailP = document.createElement('p');
                    const emailImg = document.createElement('img');
                    emailImg.id = 'email';
                    emailImg.src = modalInfo.emailSrc;
                    emailP.appendChild(emailImg);
                    footer.appendChild(emailP);
                }

                if (modalInfo.linkedinUrl) {
                    const linkedinP = document.createElement('p');
                    const linkedin = document.createElement('a');
                    linkedin.id = 'linkedin';
                    linkedin.href = modalInfo.linkedinUrl;
                    linkedin.textContent = modalInfo.linkedinText || 'LinkedIn';
                    linkedinP.appendChild(linkedin);
                    footer.appendChild(linkedinP);
                }

                if (modalInfo.githubUrl) {
                    const githubP = document.createElement('p');
                    const github = document.createElement('a');
                    github.id = 'github';
                    github.href = modalInfo.githubUrl;
                    github.textContent = modalInfo.githubText || 'GitHub';
                    githubP.appendChild(github);
                    footer.appendChild(githubP);
                }

                businessCard.appendChild(footer);
                modalContent.appendChild(businessCard);
            }

            // Add content to container
            modalElement.appendChild(modalContent);
            
            // Add to DOM
            modalContainer.appendChild(modalElement);
            console.log(`Created modal for ${bookId}:`, modalElement);

            // Add close button functionality
            closeBtn.onclick = () => {
                interactionManager.closeOpenBook();
            };

            // Add click outside to close
            modalElement.addEventListener('click', (event) => {
                if (event.target === modalElement) {
                    interactionManager.closeOpenBook();
                }
            });
        });
    });
}

// Initialize everything when the window loads
window.onload = () => {
    // Set up the scene first so interactionManager exists
    const bookshelfScene = new BookshelfScene();
    bookshelfScene.addBooksFromConfig(bookConfigs, shelfConfigs);
    bookshelfScene.animate();

    // Now wire up modals with a reference to interactionManager
    initializeModals(bookshelfScene.interactionManager);
};
