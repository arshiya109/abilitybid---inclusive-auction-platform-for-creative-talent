import java.awt.*;
import java.awt.geom.*;
import javax.swing.*;

public class ShapesApplet extends JPanel {

    @Override
    public void paintComponent(Graphics g) {
        super.paintComponent(g);

        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);

        // Background
        g2.setColor(Color.WHITE);
        g2.fillRect(0, 0, getWidth(), getHeight());

        // 1️⃣ Triangle (left)
        int[] tx = {30, 90, 20};
        int[] ty = {30, 60, 70};
        Polygon triangle = new Polygon(tx, ty, 3);

        g2.setColor(new Color(0, 120, 200, 200));
        g2.fill(triangle);
        g2.setColor(Color.BLACK);
        g2.setStroke(new BasicStroke(2f));
        g2.draw(triangle);

        // 2️⃣ Oval / ellipse (middle)
        Ellipse2D.Double oval = new Ellipse2D.Double(120, 40, 140, 60);
        g2.setColor(new Color(200, 80, 120, 180));
        g2.fill(oval);
        g2.setColor(Color.BLACK);
        g2.draw(oval);

        // 3️⃣ Outer polygon (right) + shading
        int[] px = {300, 360, 520, 520, 300, 260};
        int[] py = {90, 50, 50, 150, 150, 90};
        Polygon polygon = new Polygon(px, py, 6);

        g2.setColor(new Color(160, 200, 100, 200));
        g2.fill(polygon);
        g2.setColor(Color.BLACK);
        g2.draw(polygon);

        // 4️⃣ Inner rectangle
        Rectangle2D.Double innerRect = new Rectangle2D.Double(350, 85, 90, 40);
        g2.setColor(new Color(255, 255, 255, 200));
        g2.fill(innerRect);
        g2.setColor(Color.BLACK);
        g2.draw(innerRect);

        // 5️⃣ Shaded diagonal lines inside polygon
        Shape oldClip = g2.getClip();
        g2.setClip(polygon);
        g2.setColor(new Color(0, 0, 0, 80));
        for (int x = 310; x <= 520; x += 8) {
            g2.drawLine(x, 55, x - 30, 145);
        }
        g2.setClip(oldClip);
    }

    public static void main(String[] args) {
        JFrame frame = new JFrame("Shapes Output");
        ShapesApplet panel = new ShapesApplet();

        frame.add(panel);
        frame.setSize(600, 260);
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        frame.setVisible(true);
    }
}
